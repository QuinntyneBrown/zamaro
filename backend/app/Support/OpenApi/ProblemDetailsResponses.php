<?php

namespace App\Support\OpenApi;

use Dedoc\Scramble\Support\ExceptionToResponseExtensions\HttpExceptionToResponseExtension;
use Dedoc\Scramble\Support\Generator\Response;
use Dedoc\Scramble\Support\Generator\Schema;
use Dedoc\Scramble\Support\Generator\Types as OpenApiTypes;
use Dedoc\Scramble\Support\Type\ObjectType;
use Dedoc\Scramble\Support\Type\Type;
use Illuminate\Database\RecordsNotFoundException;
use Illuminate\Validation\ValidationException;
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
            && ($type->isInstanceOf(HttpException::class)
                || $type->isInstanceOf(RecordsNotFoundException::class)
                || $type->isInstanceOf(ValidationException::class));
    }

    public function toResponse(Type $type)
    {
        if (! $type instanceof ObjectType) {
            return null;
        }
        $validation = $type->isInstanceOf(ValidationException::class);
        $status = match (true) {
            $validation => 422,
            $type->isInstanceOf(RecordsNotFoundException::class), $type->isInstanceOf(NotFoundHttpException::class) => 404,
            default => parent::toResponse($type)?->code,
        };
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
        if ($validation) {
            $body->addProperty('errors', (new OpenApiTypes\ObjectType)
                ->additionalProperties((new OpenApiTypes\ArrayType)->setItems(new OpenApiTypes\StringType))
                ->setDescription('Messages keyed by field.'));
            $body->setRequired(['type', 'title', 'status', 'detail', 'requestId', 'errors']);
        }

        return Response::make($status)
            ->setDescription($validation ? 'Validation failed' : $this->getDescription($type))
            ->setContent('application/problem+json', Schema::fromType($body));
    }
}
