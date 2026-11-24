# VDBH Terrein Viewer

Officiële updates en bronbestanden voor de VDBH Terrein Viewer.

## Nieuwste versie: BETA 0.2.69

[Download de nieuwste Windows-installer](https://github.com/VDBH-hub/VDBH-Terrein-Viewer-Releases/releases/latest)

Deze versie bevat snelknoppen voor alle gereedschappen, lokaal projectbeheer,
opmerkingen met exacte locaties, dynamische profielen en professionele PDF-rapporten.

## Installeren

Download de Setup.exe bij Releases. Bestaande opgeslagen projecten en rapporten
blijven behouden bij een update. De ZIP bevat het bouwpakket.

## Zelf bouwen

Pak het bouwpakket uit in een nieuwe map en start `build-windows.bat` op Windows.
De handleiding vind je in de app via Help > Handleiding (F1).

## Publiceren

Een wijziging van `package.json` op `main` start de Windows-build. De workflow
controleert de versie en changelog, bouwt de installer en uploadt Setup.exe,
blockmap, latest.yml en het bouwpakket. De release wordt pas gepubliceerd nadat
alle bestanden zijn geüpload. Een reeds gepubliceerde versie wordt niet overschreven.
