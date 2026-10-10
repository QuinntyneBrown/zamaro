<?php

namespace App\Enums;

/** The kind of gathering a booker searches for (L2-004); values are the URL slugs. */
enum GatheringKind: string
{
    case SundayService = 'sunday-service';
    case WorshipNight = 'worship-night';
    case YouthEvent = 'youth-event';
    case ConferenceOrRetreat = 'conference-or-retreat';
    case Wedding = 'wedding';
    case FuneralOrMemorial = 'funeral-or-memorial';
}
