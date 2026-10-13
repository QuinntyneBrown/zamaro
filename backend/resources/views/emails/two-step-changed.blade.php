{{-- TwoStepSignInChangedNotification: every word comes from the emails catalogue (ADR-0019). --}}
<x-mail::layout>
<x-slot:header>
<x-mail::header :url="$webUrl">
{{ config('app.name') }}
</x-mail::header>
</x-slot:header>

{{ $greeting }}

{{ $intro }}

{{ $notYou }}

<x-mail::button :url="$link">
{{ $action }}
</x-mail::button>

<x-slot:footer>
<x-mail::footer>
{{ $footer }}
</x-mail::footer>
</x-slot:footer>
</x-mail::layout>
