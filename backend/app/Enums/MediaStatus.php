<?php

namespace App\Enums;

/** Where an uploaded photo or video is: only Live media is ever public (L2-014.3, L2-052.2). */
enum MediaStatus: string
{
    case Processing = 'processing';
    case Live = 'live';
    case Failed = 'failed';
}
