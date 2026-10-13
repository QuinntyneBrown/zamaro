<?php

namespace Database\Seeders;

use App\Models\ArtistPhoto;
use App\Models\ArtistVideo;
use GdImage;
use Illuminate\Contracts\Filesystem\Filesystem;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;

/**
 * Writes a stand-in file to the media disk for every photo rendition, poster frame, stream and
 * caption key the cast refers to (M1 has no uploads or object storage). Photos and posters are
 * drawn with GD; every live video shares the sample HLS stream in `media/sample-video`. Files that
 * already exist are left alone, so running it again changes nothing.
 */
class MediaSeeder extends Seeder
{
    public const SAMPLE_STREAM = 'samples/video/stream.m3u8';

    public const SAMPLE_CAPTIONS = 'samples/video/captions.en.vtt';

    public function run(): void
    {
        $disk = Storage::disk(config('zamaro.media.disk'));

        foreach (File::files(__DIR__.'/media/sample-video') as $file) {
            $this->putOnce($disk, 'samples/video/'.$file->getFilename(), fn () => $file->getContents());
        }

        ArtistPhoto::query()->orderBy('artist_id')->orderBy('position')->each(function (ArtistPhoto $photo) use ($disk) {
            $missing = array_filter($photo->renditions, fn (array $rendition) => ! $disk->exists($rendition['key']));
            if ($missing === []) {
                return;
            }
            $original = $this->draw($photo->width, $photo->height, crc32($photo->artist_id.'/'.$photo->position));
            foreach ($missing as $rendition) {
                $disk->put($rendition['key'], $this->encode($original, $rendition['width'], $rendition['format']));
            }
        });

        ArtistVideo::query()->whereNotNull('poster_key')->each(function (ArtistVideo $video) use ($disk) {
            $this->putOnce($disk, $video->poster_key, fn () => $this->encode(
                $this->draw(800, 450, crc32($video->artist_id.'/video/'.$video->position)), 800, 'webp',
            ));
        });
    }

    /**
     * @param  callable(): string  $contents
     */
    private function putOnce(Filesystem $disk, string $key, callable $contents): void
    {
        if (! $disk->exists($key)) {
            $disk->put($key, $contents());
        }
    }

    /** A stage-lit crowd: a warm gradient, a spotlight and a row of heads, varied by the seed. */
    private function draw(int $width, int $height, int $seed): GdImage
    {
        mt_srand($seed);
        $image = imagecreatetruecolor($width, $height);
        $top = [mt_rand(40, 90), mt_rand(20, 60), mt_rand(60, 110)];
        $bottom = [mt_rand(150, 230), mt_rand(90, 160), mt_rand(40, 90)];
        for ($y = 0; $y < $height; $y++) {
            $t = $y / $height;
            $color = imagecolorallocate($image, ...array_map(fn ($a, $b) => (int) ($a + ($b - $a) * $t), $top, $bottom));
            imageline($image, 0, $y, $width, $y, $color);
        }
        $light = imagecolorallocatealpha($image, 255, 240, 200, 70);
        imagefilledellipse($image, mt_rand((int) ($width * 0.3), (int) ($width * 0.7)), (int) ($height * 0.3), (int) ($width * 0.5), (int) ($height * 0.6), $light);
        $ink = imagecolorallocate($image, 20, 16, 24);
        $heads = mt_rand(3, 7);
        for ($i = 0; $i < $heads; $i++) {
            $x = (int) (($i + 0.5) * $width / $heads + mt_rand(-20, 20));
            $r = (int) ($height * mt_rand(9, 13) / 100);
            imagefilledellipse($image, $x, (int) ($height * 0.72), $r, (int) ($r * 1.2), $ink);
            imagefilledellipse($image, $x, $height, (int) ($r * 2.2), (int) ($height * 0.45), $ink);
        }

        return $image;
    }

    private function encode(GdImage $original, int $width, string $format): string
    {
        $resized = imagescale($original, $width, (int) round(imagesy($original) * $width / imagesx($original)), IMG_BICUBIC);
        ob_start();
        $format === 'avif' ? imageavif($resized, null, 50, 10) : imagewebp($resized, null, 80);

        return (string) ob_get_clean();
    }
}
