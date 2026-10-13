<?php

namespace App\Http\Requests\ArtistOnboarding;

use Illuminate\Foundation\Http\FormRequest;

/** What an applicant says about a video before its bytes arrive (apply-as-artist, L2-052.4). */
class StartApplicationVideoUploadRequest extends FormRequest
{
    public const MAX_BYTES = 1024 * 1024 * 1024;

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            /** 5 to 100 characters: "Way Maker — live at Cornerstone". */
            'title' => ['required', 'string', 'min:5', 'max:100'],
            /** The file's name as the browser knows it; the type is read from the bytes, never from this. */
            'fileName' => ['required', 'string', 'max:255'],
            /** The whole file in bytes, up to 1 GB; the last chunk must bring the upload exactly here. */
            'size' => ['required', 'integer', 'min:1', 'max:'.self::MAX_BYTES],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'title.required' => 'Give the video a title of 5 to 100 characters.',
            'title.min' => 'Give the video a title of 5 to 100 characters.',
            'title.max' => 'Give the video a title of 5 to 100 characters.',
            'size.max' => 'Choose a video up to 1 GB.',
        ];
    }
}
