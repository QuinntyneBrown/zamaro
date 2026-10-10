<?php

namespace App\Enums;

/** Musical styles an artist offers; values are the URL slugs (L2-008). */
enum Style: string
{
    case Band = 'band';
    case SoloVocalist = 'solo-vocalist';
    case GospelChoir = 'gospel-choir';
    case Acoustic = 'acoustic';
    case Hymns = 'hymns';
    case Spanish = 'spanish';
}
