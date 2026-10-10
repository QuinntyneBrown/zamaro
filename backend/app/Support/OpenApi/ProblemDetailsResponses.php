<?php

namespace App\Support\OpenApi;

use App\Actions\Accounts\LinkExpired;
use App\Actions\ArtistProfiles\ArtistMoved;
use App\Actions\ArtistProfiles\ArtistNotFound;
use App\Actions\Privacy\LegalDocumentOutdated;
use Dedoc\Scramble\Support\ExceptionToResponseExtensions\HttpExceptionToResponseExtension;
use Dedoc\Scramble\Support\Generator\Response;
use Dedoc\Scramble\Support\Generator\Schema;
use Dedoc\Scramble\Support\Generator\Types as OpenApiTypes;
use Dedoc\Scramble\Support\Type\ObjectType;
use Dedoc\Scramble\Support\Type\Type;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\RecordsNotFoundException;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\TooManyRequestsHttpException;

/**
 * Documents every HTTP error as the RFC 9457 body ProblemDetailsRenderer returns (ADR-0006).
 * Registered after Scramble's own extensions, so it wins.
 */
class ProblemDetailsResponses extends HttpExceptionToResponseExtension
{
    public function shouldHandle(Type $type)
    {
        return $type instanceof ObjectType
            && ($type->isInstanceOf(HttpException::class)
                || $type->isInstanceOf(AuthenticationException::class)
                || $type->isInstanceOf(RecordsNotFoundException::class)
                || $type->isInstanceOf(ValidationException::class));
    }

    public function toResponse(Type $type)
    {
        if (! $type instanceof ObjectType) {
            return null;
        }
        if ($type->isInstanceOf(ArtistMoved::class)) {
            return Response::make(301)
                ->setDescription('A retired slug: `Location` is the same address under the current slug, with the query string kept.');
        }
        $validation = $type->isInstanceOf(ValidationException::class);
        $status = match (true) {
            $validation => 422,
            $type->isInstanceOf(AuthenticationException::class) => 401,
            $type->isInstanceOf(RecordsNotFoundException::class), $type->isInstanceOf(NotFoundHttpException::class) => 404,
            $type->isInstanceOf(TooManyRequestsHttpException::class) => 429,
            $type->isInstanceOf(LegalDocumentOutdated::class) => 409,
            $type->isInstanceOf(LinkExpired::class) => 410,
            default => parent::toResponse($type)?->code,
        };
        if ($status === null) {
            return null;
        }

        $body = self::problemBody();
        if ($validation) {
            $body->addProperty('errors', (new OpenApiTypes\ObjectType)
                ->additionalProperties((new OpenApiTypes\ArrayType)->setItems(new OpenApiTypes\StringType))
                ->setDescription('Messages keyed by field.'));
            $body->setRequired(['type', 'title', 'status', 'detail', 'requestId', 'errors']);
        }
        if ($type->isInstanceOf(ArtistNotFound::class)) {
            $body->addProperty('similarArtists', (new OpenApiTypes\ObjectType)
                ->addProperty('date', (new OpenApiTypes\StringType)->format('date')->setDescription('The day they are free: the carried date, or the first bookable day.'))
                ->addProperty('radiusKm', new OpenApiTypes\IntegerType)
                ->addProperty('items', (new OpenApiTypes\ArrayType)
                    ->setItems((new OpenApiTypes\ObjectType)->setDescription('A lineup ticket, as in `GET /search` `data`.'))
                    ->setDescription('Up to 3, nearest first.'))
                ->setRequired(['date', 'radiusKm', 'items'])
                ->setDescription('On the profile only: artists of the same primary style free on the carried search date (L2-021).'));
        }

        return Response::make($status)
            ->setDescription($validation ? 'Validation failed' : $this->getDescription($type))
            ->setContent('application/problem+json', Schema::fromType($body));
    }

    /** The members every problem body has (RFC 9457 plus `requestId`). */
    public static function problemBody(): OpenApiTypes\ObjectType
    {
        return (new OpenApiTypes\ObjectType)
            ->addProperty('type', (new OpenApiTypes\StringType)->setDescription('Problem type URI, or about:blank.'))
            ->addProperty('title', new OpenApiTypes\StringType)
            ->addProperty('status', new OpenApiTypes\IntegerType)
            ->addProperty('detail', new OpenApiTypes\StringType)
            ->addProperty('requestId', (new OpenApiTypes\StringType)->format('uuid')->setDescription('Matches X-Request-Id.'))
            ->setRequired(['type', 'title', 'status', 'detail', 'requestId']);
    }
}
