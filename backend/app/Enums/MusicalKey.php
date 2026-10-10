<?php

namespace App\Enums;

/** The key a setlist song is led in (L2-016): 12 major, 12 minor, or any key. */
enum MusicalKey: string
{
    case C = 'C';
    case DFlat = 'D-flat';
    case D = 'D';
    case EFlat = 'E-flat';
    case E = 'E';
    case F = 'F';
    case FSharp = 'F-sharp';
    case G = 'G';
    case AFlat = 'A-flat';
    case A = 'A';
    case BFlat = 'B-flat';
    case B = 'B';
    case CMinor = 'C-minor';
    case CSharpMinor = 'C-sharp-minor';
    case DMinor = 'D-minor';
    case EFlatMinor = 'E-flat-minor';
    case EMinor = 'E-minor';
    case FMinor = 'F-minor';
    case FSharpMinor = 'F-sharp-minor';
    case GMinor = 'G-minor';
    case GSharpMinor = 'G-sharp-minor';
    case AMinor = 'A-minor';
    case BFlatMinor = 'B-flat-minor';
    case BMinor = 'B-minor';
    case AnyKey = 'any';
}
