<?php

namespace App\Support\OpenApi;

use Dedoc\Scramble\Support\ExceptionToResponseExtensions\HttpExceptionToResponseExtension;
use Dedoc\Scramble\Support\Generator\Response;
use Dedoc\Scramble\Support\Generator\Schema;
use Dedoc\Scramble\Support\Generator\Types as OpenApiTypes;
use Dedoc\Scramble\Support\Type\ObjectType;
use Dedoc\Scramble\Support\Type\Type;
use Illuminate\Database\RecordsNotFoundException;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

/**
 * Documents every HTTP error as the RFC 9457 body ProblemDetailsRenderer returns (ADR-0006).
 * Registered after Scramble's own extensions, so it wins.
 */
class ProblemDetailsResponses extends HttpExceptionToResponseExtension
{
    public function shouldHandle(Type $type)
    {
        return $type instanceof ObjectType
            && ($type->isInstanceOf(HttpException::class) || $type->isInstanceOf(RecordsNotFoundException::class));
    }

    public function toResponse(Type $type)
    {
        $notFound = $type instanceof ObjectType
            && ($type->isInstanceOf(RecordsNotFoundException::class) || $type->isInstanceOf(NotFoundHttpException::class));
        $status = $notFound ? 404 : parent::toResponse($type)?->code;
        if ($status === null) {
            return null;
        }

        $body = (new OpenApiTypes\ObjectType)
            ->addProperty('type', (new OpenApiTypes\StringType)->setDescription('Problem type URI, or about:blank.'))
            ->addProperty('title', new OpenApiTypes\StringType)
            ->addProperty('status', new OpenApiTypes\IntegerType)
            ->addProperty('detail', new OpenApiTypes\StringType)
            ->addProperty('requestId', (new OpenApiTypes\StringType)->format('uuid')->setDescription('Matches X-Request-Id.'))
            ->setRequired(['type', 'title', 'status', 'detail', 'requestId']);

        return Response::make($status)
            ->setDescription($this->getDescription($type))
            ->setContent('application/problem+json', Schema::fromType($body));
    }
}
