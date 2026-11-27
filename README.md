# VDBH Terrein Viewer

Officiële Windows-app voor terreinmodellen, metingen en opmerkingen.

## Nieuwste versie: 1.0.1

[Download de nieuwste Windows-installer](https://github.com/VDBH-hub/VDBH-Terrein-Viewer-Releases/releases/latest)

- DXF, LandXML en ondersteunde Trimble SVD/SVL-bestanden importeren.
- Terreinmodellen in 3D bekijken, punten meten, profielen maken en volumes berekenen.
- Opmerkingen met exacte locaties in het model plaatsen en lokaal per project bewaren.
- Professionele opmerkingenrapporten als PDF exporteren.
- Complete projecten met opmerkingen uitwisselen via één `.vdbhproject`-bestand.
- Een ontvangen project direct via dubbelklik openen in de viewer.

Installeer de Setup.exe uit Releases. De bestaande lokale projecten en rapporten
blijven beschikbaar bij een update. De installer registreert de bestandsextensie.

## Handleiding en voorbeeld

Open in de app **Help > Handleiding (F1)**. De ZIP bevat ook een losse HTML- en
teksthandleiding en een fictief voorbeeldproject zonder klantgegevens.

## Zelf bouwen

Pak het bouwpakket uit en start `build-windows.bat` op Windows. De lokale build
publiceert niets online. De gemaakte installer staat in `dist`.

## Releases

Een versie-update op `main` start de Windows-build. De workflow controleert
versie en changelog, bouwt de installer en uploadt Setup.exe, blockmap,
latest.yml en het bouwpakket. De release wordt pas gepubliceerd wanneer alle
bestanden zijn geüpload. Een reeds gepubliceerde versie wordt niet overschreven.
