<?php

namespace App\Http\Controllers\Api\V1\UserExperience;

use App\Http\Controllers\Controller;
use App\Services\UserExperience\Catalogue;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class TranslationCatalogueController extends Controller
{
    /**
     * The translation catalogue for one locale, with English filling any missing key.
     *
     * Revalidate with `If-None-Match`; an unchanged catalogue returns 304.
     */
    public function show(Request $request, Catalogue $catalogue, string $locale): JsonResponse
    {
        if (! $catalogue->has($locale)) {
            throw new NotFoundHttpException("No catalogue for locale {$locale}.");
        }

        $body = ['data' => [
            'locale' => $locale,
            /**
             * ICU messages keyed `{namespace}.{key}`.
             *
             * @var array<string, string>
             */
            'messages' => $catalogue->messages($locale),
        ]];

        $response = response()
            ->json($body, 200, [], JSON_UNESCAPED_UNICODE)
            ->setPublic()
            ->setMaxAge(0)
            ->setSharedMaxAge(60);
        $response->setEtag(hash('sha256', $response->getContent()));
        $response->isNotModified($request);

        return $response;
    }
}
