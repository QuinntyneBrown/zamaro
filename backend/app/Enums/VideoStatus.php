<?php

namespace App\Enums;

/** An upload's progress (L2-052.2). Only Live videos are shown publicly (L2-014.3). */
enum VideoStatus: string
{
    case Uploading = 'uploading';
    case Processing = 'processing';
    case Live = 'live';
    case Failed = 'failed';
}
