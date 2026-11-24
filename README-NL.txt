VDBH TERREIN VIEWER BETA 0.2.68

SNELKNOPPEN BOVEN DE 3D-VIEWER

Pak uit in een nieuwe map, start build-windows.bat en installeer Setup-0.2.68.exe.
Bestaande opgeslagen projecten en rapporten blijven beschikbaar.

De balk 3D Surface Viewer bevat nu alle gereedschappen als icoonknoppen.
Houd de muis boven een knop voor de naam. Een actief gereedschap licht groen op.
De knoppen gebruiken dezelfde acties als Gereedschappen in de menubalk.
Na het afronden van een actie schakelt het gereedschap weer uit.
Boundary sluiten is beschikbaar wanneer Boundary tekenen actief is.
Tijdens een import, projectactie of rapportexport zijn de snelknoppen geblokkeerd.
Op smalle schermen worden de knoppen verdeeld over extra regels.
Tab en de pijltjestoetsen zijn bruikbaar voor toetsenbordbediening.
Help > Handleiding is aangevuld met de nieuwe snelknoppen.

VDBH TERREIN VIEWER BETA 0.2.67

HANDLEIDING EN BESCHIKBAARHEID OPMERKINGENEXPORT

Pak uit in een nieuwe map, start build-windows.bat en installeer Setup-0.2.67.exe.
Bestaande opgeslagen projecten en rapporten blijven beschikbaar.

- Help > Handleiding (F1) beschrijft nu de huidige menubalk en alle hoofdacties.
- Bestanden > Exporteren is actief zodra er opmerkingen of een berekening zijn.
- Opmerkingenrapport (PDF) is alleen actief bij minimaal één opmerking.
- Zonder opmerkingen blijft een depotrapport na een berekening beschikbaar.
- Verwijder je de laatste opmerking, dan gaat de opmerkingenexport weer uit.
- Een project met opgeslagen opmerkingen kan direct een opmerkingenrapport maken.

VDBH TERREIN VIEWER BETA 0.2.66

PROFESSIONEEL OPMERKINGENRAPPORT

Pak uit in een nieuwe map, start build-windows.bat en installeer Setup-0.2.66.exe.
Bestaande opgeslagen projecten en rapporten blijven beschikbaar.

Kies Bestanden > Exporteren > Opmerkingenrapport (PDF).
Het nieuwe rapport bevat:
- Het VDBH-bedrijfslogo en compacte projectgegevens.
- Een bovenaanzicht van de surfaces, geimporteerde lijnen en zichtbare ondergronden.
- Genummerde opmerkingen met exacte puntmarkering en verbindingslijntje.
- Oranje voor open en groen voor afgehandelde opmerkingen.
- Noordpijl (positieve model-Y) en schaalbalk voor de tekening.
- Een tabel met nummer, status, tekst en exacte X/Y/Z-coordinaten.
- Herhaalde tabelkoppen en paginanummers op vervolgpagina's.

Het overzicht toont modelgeometrie, geen luchtfoto. De tekening wordt apart
opgebouwd; de stand en zichtbaarheid in de 3D-viewer worden niet gewijzigd.
De PDF wordt bij het project bewaard en is terug te vinden via Rapporten.
Eerder gemaakte rapporten blijven in hun oorspronkelijke opmaak beschikbaar.

VDBH TERREIN VIEWER BETA 0.2.65

OPMERKINGENRAPPORT ALS PDF

- Pak uit in een nieuwe map en start build-windows.bat.
- Installeer de Setup-0.2.65.exe uit dist.
- Bestaande opgeslagen projecten en rapporten blijven beschikbaar.

PDF maken:
1. Plaats opmerkingen in het model.
2. Kies Bestanden > Exporteren > Opmerkingenrapport (PDF).
3. Geef bij een nieuw project een projectnaam op wanneer hierom gevraagd wordt.
4. Het rapport bevat projectnaam, nummer, rapportdatum, alle opmerkingen met
   status Open/Afgehandeld en exacte X/Y/Z-coordinaten.
5. De PDF wordt gedownload en bij het project opgeslagen. Via Rapporten of
   Start > Projectoverzicht > Rapporten kun je hem opnieuw openen.

Een depotberekening is hiervoor niet nodig. Het depotrapport blijft na een
volumeberekening beschikbaar in hetzelfde keuzemenu en via de PDF-knop.
Deze aparte export bevat opmerkingen; profielgrafieken en meetpunten zijn
geen onderdeel van het opmerkingenrapport.

Functionele controles gebruiken echte PDF-generatie en projectopslag.
Schermonderdelen en WebGL zijn nagebootst; een visuele Windows-controle
is hier niet uitgevoerd. Dit is een bouwpakket, geen vooraf gebouwde installer.

Eerdere gebruiksnotities:

VDBH TERREIN VIEWER BETA 0.2.64

LAATSTE CHANGELOG EN GEREEDSCHAPPEN AUTOMATISCH UITSCHAKELEN

Installeren:
- Pak de ZIP uit in een nieuwe map.
- Start build-windows.bat en installeer de Setup-0.2.64.exe uit dist.
- Bestaande opgeslagen projecten, opmerkingen en rapporten blijven beschikbaar.

Nieuw in deze versie:
- De automatische popup en Help > Wat is nieuw tonen alleen de wijzigingen
  van de huidige versie. De popup verschijnt eenmaal per versie.
- Na een hoogtepunt of een gekozen opmerkingspunt staat het gereedschap uit.
- Een lijnprofiel wordt na het tweede punt opgeslagen en het gereedschap gaat uit.
- Een polyline-profiel rond je af met Enter, dubbelklikken of Profiel opslaan.
- De dynamische koppeling tussen profiel en model blijft daarna werken.
- Een getekende boundary sluit je met Enter of dubbelklikken. Daarna gaat
  het gereedschap uit en wordt het volume berekend.
- Boundary selecteren kiest eenmaal een contour en gaat daarna uit. Kies het
  gereedschap opnieuw om een extra contour toe te voegen; de eerdere blijven staan.
- Escape schakelt een actief gereedschap uit.

Controle:
- Functioneel getest met de echte viewerlogica en jouw SVD/SVL-testbestanden:
  automatisch uitschakelen, profielopslag, dubbelklik zonder dubbel eindpunt,
  boundary-selecties, dynamische profielcursor en projectopslag/herladen.
- Changelog-, menu-, opmerkingen-, rapport- en opslagcontroles geslaagd.
- Schermonderdelen en WebGL zijn nagebootst; een echte visuele Windows-controle
  kon hier niet worden uitgevoerd.
- Dit is een bouwpakket; een Windows-installer is niet vooraf gebouwd.

Eerdere release- en gebruiksnotities:

VDBH TERREIN VIEWER BETA 0.2.63

EXACTE OPMERKINGSPUNTEN EN DYNAMISCH LENGTEPROFIEL

Installeren:
- Pak de ZIP uit in een nieuwe map.
- Start build-windows.bat en installeer de Setup-0.2.63.exe uit dist.
- Bestaande opgeslagen projecten, opmerkingen en rapporten blijven beschikbaar.

Opmerkingslabels:
- Onder ieder label staat nu een klein punt op de exacte aangeklikte coordinaten.
- Een kort verticaal verbindingslijntje verbindt het label met het punt.
- De puntmarkering in het model is even groot als een hoogtepuntmarkering.
- Open opmerkingen zijn oranje; afgehandelde opmerkingen zijn groen.
- De oorspronkelijke coordinaten van bestaande opmerkingen worden niet aangepast.
- Dit werkt ook in het aparte 3D-venster.

Dynamisch profiel:
1. Maak of open een lijnprofiel/polyline-profiel.
2. Open het paneel met Profiel boven de 3D-viewer als dit nog is ingeklapt.
3. Beweeg de muis binnen het grafiekvlak: een verticale cursor en punten tonen
   de hoogte per surface. De overeenkomstige XY-positie wordt in het model getoond.
4. Beweeg de muis langs het actieve profieltrace in het model: de cursor in de
   grafiek springt naar de overeenkomstige afstand langs het trace.
5. Hetzelfde werkt vanuit het aparte 3D-venster.

Details:
- De afstand wordt langs alle XY-segmenten van het trace gemeten, inclusief knikken.
- De uitlezing toont afstand, X/Y en de actuele Z-hoogte per surface.
- In de grafiek wordt de surface die het dichtst bij de muis ligt primair getoond.
  Vanuit het model wordt de actieve surface gebruikt, of een beschikbare andere surface.
- De modelkoppeling volgt de zichtbare profiellijn met een muismarge van 14 schermpixels.
- Een plek buiten een surface krijgt geen verzonnen hoogte; de uitlezing meldt geen hoogte.
- Bij slepen, buiten het trace/grafiekvlak, bij projectwisselen of na inklappen van
  het profiel verdwijnt de tijdelijke cursor.
- De cursor maakt geen nieuwe meetpunten en wordt niet in het project of PDF opgeslagen.
- Tijdens bewegen wordt alleen de actuele cursorpositie verwerkt; het complete
  profiel wordt niet opnieuw bemonsterd of getekend.

Controle:
- Getest: exacte label-ankering op de opgeslagen XYZ, kleine 3D-markering,
  afstandsberekening over knikken, perspectiefselectie in het model, meerdere
  surfaces, ontbrekende hoogtes, nulhoogte, slepen, inklappen en aparte vensters.
- Getest met jouw SVD-terreinmodel: de cursor gebruikt echte surfacehoogtes.
- Bestaande opslag-, projectbeheer-, rapport-, menu- en changelogtests zijn herhaald.
- Schermonderdelen/WebGL zijn tijdens de tests nagebootst; een echte visuele
  Windows-controle kon hier niet worden uitgevoerd.
- Dit is een bouwpakket; er is geen Windows-installer vooraf gebouwd of gepubliceerd.

Eerdere release- en importnotities:

VDBH TERREIN VIEWER BETA 0.2.62

NIEUWE MENUBALK EN COMPACTE WERKRUIMTE

Installeren:
- Pak deze ZIP uit in een nieuwe map.
- Start build-windows.bat en installeer de Setup-0.2.62.exe uit dist.
- Je bestaande opgeslagen projecten en rapporten blijven beschikbaar.

Menu's:
Start
  Nieuw project
  Project openen
  Project opslaan (Ctrl+S)
  Projectoverzicht
  Afsluiten

Bestanden
  Importeren (DXF, LandXML, SVD en SVL)
  Ondergrond (DXF)
  Exporteren (PDF; beschikbaar na een geslaagde berekening)

Gereedschappen
  Meten & Profielen: Opmerking plaatsen, Hoogtepunt, Hoogtepunten verwijderen,
  Lijnprofiel, Polyline-profiel en Profielen verwijderen.
  Boundary & Selectie: Boundary tekenen, Boundary selecteren, Boundary sluiten,
  Bereken volume en Selectie wissen.

Help
  Handleiding (F1)
  Wat is Nieuw?

Indeling:
- De hoofdweergave blijft binnen het venster; de hoofdpagina scrollt niet.
- De 3D-viewer gebruikt de beschikbare ruimte tussen de menubalk en statusbalk.
- Links staan de tekeningen en opmerkingen; rechts de hoogte- en volumegegevens.
- Lange lijsten blijven bereikbaar met een scrollvak in het eigen paneel.
- Via Profiel boven de viewer kun je het lengteprofiel in- of uitklappen.
  Bij kiezen van Lijnprofiel of Polyline-profiel klapt het automatisch open.
- Op smallere vensters openen Lagen en Volumes de bijbehorende zijpanelen.
- De statusbalk toont het actieve project, opslagstatus en de laatste melding.
- Gebruik F10 of Alt+S/B/G/H om de menu's met het toetsenbord te openen.
  Pijltjestoetsen kiezen acties; Escape sluit het menu.

Projectbeheer:
- Ga naar Start > Projectoverzicht.
- Zoeken filtert op naam en nummer.
- Per project: Openen, Naam / nummer wijzigen, Rapporten en Verwijderen.
- Verwijderen verplaatst het project met alle bijbehorende rapporten naar de
  interne prullenbak. Het project is daarna niet meer in de normale lijst zichtbaar.
- Onder Prullenbak kies je Herstellen om het project en zijn rapporten terug te zetten.
- Verwijder je het actieve project, dan wordt de viewer geleegd na bevestiging.
  Niet-opgeslagen wijzigingen worden eerst gemeld.
- De oorspronkelijke geimporteerde DXF/XML/SVD/SVL-bronbestanden worden niet verwijderd.
- Er is geen definitief verwijderen of automatisch legen van de prullenbak toegevoegd.

Changelog:
- Bij de eerste start van 0.2.62 verschijnt de nieuwe changelog eenmaal.
- Later opnieuw bekijken kan via Help > Wat is Nieuw?

Controle:
- Geautomatiseerd gecontroleerd: alle menutoewijzingen, toetsenbordbediening,
  exportbeschikbaarheid en het open-/dichtklappen van het profielpaneel.
- Getest: project hernoemen, veilig verwijderen, herstellen na herstart, behoud van
  PDF-bestanden, scheiding tussen projecten en terugzetten bij een fout in de viewer.
- Bestaande controles voor opslag, import, opmerkingen, PDF-bijlagen en changelogstatus
  zijn opnieuw uitgevoerd. Jouw SVD/SVL-voorbeeld is opnieuw opgeslagen en teruggeladen.
- HTML-structuur, unieke besturings-ID's en alle JavaScript-bestanden zijn gecontroleerd.
- Een echte schermcontrole in WebGL en een Windows-installatietest konden in deze
  uitvoeromgeving niet worden uitgevoerd. De indeling is bedoeld voor desktopvensters;
  controleer het resultaat op jouw scherm en Windows-schaalinstelling.
- Dit is een bouwpakket, geen vooraf gebouwde Windows-installer.
- Er is niets naar GitHub gepubliceerd.

Eerdere release- en importnotities:

VDBH TERREIN VIEWER BETA 0.2.61

NIEUW: PROJECTEN, OPMERKINGEN, RAPPORTEN EN CHANGELOG

Installeren:
1. Pak deze ZIP volledig uit in een nieuwe map.
2. Start build-windows.bat en installeer de Setup-0.2.61.exe uit dist.
   Er is internet nodig voor het ophalen van de bouwonderdelen.
3. De bestaande SVD/SVL-, DXF- en LandXML-import blijft beschikbaar.

Projectopslag:
- Vul bovenaan een projectnaam en eventueel projectnummer in.
- Kies Project opslaan of druk op Ctrl+S.
- Modellen, geometrie, ondergronden, kleuren, transparantie, hoogtepunten,
  profielen, depotgrenzen, berekeningsresultaten, opmerkingen en camerastand
  worden samen bewaard. De originele bronbestanden zijn daarna niet nodig om
  het opgeslagen model opnieuw te openen.
- Via Project openen kun je een opgeslagen project kiezen.
- Via Nieuw project begin je met een leeg model. Niet-opgeslagen wijzigingen
  worden eerst gemeld; je kunt opslaan, doorgaan zonder opslaan of annuleren.
- Opslaan gebeurt lokaal in de Windows-applicatiegegevensmap, in Projects,
  buiten de installatiemap. Updates verwijderen deze gegevens niet.
- Opgeslagen projecten bevatten een vorige versie (project.previous.json)
  als reservebestand na een volgende geslaagde opslag.
- Dit is handmatige projectopslag, geen periodieke automatische opslag.
- Een tweede start activeert de bestaande app om gelijktijdig overschrijven
  door meerdere appvensters te voorkomen.

Opmerkingen:
- Kies Opmerking plaatsen en klik op het terrein. Bij alleen een ondergrond
  kan op het 2D-vlak (Z=0) worden geplaatst.
- Schrijf de opmerking en kies Open of Afgehandeld.
- Het linkerpaneel biedt Tonen en Wijzigen. Via Wijzigen kun je ook verwijderen.
- De markers en korte labels staan ook in het aparte 3D-venster.
- Labels kunnen worden verborgen. Tekst en meetcoordinaten blijven bewaard.
- Sla het project op om nieuwe of gewijzigde opmerkingen te bewaren.

Rapporten per project:
- Voer de volumeberekening uit en exporteer de PDF zoals gebruikelijk.
- Voor de export wordt eerst het actieve project opgeslagen.
- De PDF wordt automatisch als een afzonderlijk rapport bij dit project bewaard.
  Een volgende PDF overschrijft een eerder rapport niet.
- Rapporten per project biedt projectkeuze, datum, volume, materiaal en PDF openen.
- Opmerkingen kunnen als extra PDF-bijlage worden opgenomen. Deze optie staat
  bij Rapportgegevens. Het bestaande depotrapport behoudt zijn huidige opmaak.
- Alleen rapporten die met deze versie worden aangemaakt komen automatisch in
  dit overzicht; eerder los opgeslagen PDF's worden niet geimporteerd.

Changelog:
- Wat is er nieuw? verschijnt eenmaal bij de eerste start van iedere versie.
- De status blijft over herstarts en projectwissels bewaard.
- De knop Wat is er nieuw? naast Handleiding opent de wijzigingen opnieuw.
- Ontwikkeling: voeg de nieuwe versie en wijzigingen toe aan changelog.json.
  build-windows.bat controleert dat de actuele package-versie in de changelog staat.

Controle:
- Geautomatiseerd getest: opslag en terugladen na een herstart, scheiding van
  projecten en rapporten, exacte PDF-bytes, conflicterende opslag, ongeldige
  geometrie en bestandsverwijzingen, opmerkingen plaatsen/wijzigen/afhandelen/
  verwijderen, PDF-bijlagen met lange tekst en meerdere pagina's, eenmalige
  changelogstatus, en opslaan bij afsluiten.
- Jouw SVD/SVL-voorbeeld is via de daadwerkelijke bestandsimport ingelezen,
  opgeslagen, vanaf schijf geladen en door de renderer teruggezet. Geometrie,
  coordinaten, ondergronden, opmerkingen en instellingen kwamen overeen.
- JavaScript-startup is getest met echte Three.js-geometrie en nagebootste
  schermonderdelen. Een echte WebGL-schermcontrole en Windows-installatie
  konden in deze uitvoeromgeving niet worden uitgevoerd.
- Dit pakket bevat broncode en het Windows-bouwscript, geen vooraf gebouwde EXE.
- Er is niets naar GitHub gepubliceerd.

Eerdere release- en importnotities:

VDBH TERREIN VIEWER BETA 0.2.60 — EXPERIMENTELE TRIMBLE-IMPORT

Gebruik:
1. Pak deze ZIP volledig uit in een NIEUWE map.
2. Start build-windows.bat. Internet is nodig voor het installeren van bouwonderdelen.
3. Installeer de nieuwe Setup-0.2.60.exe uit de map dist.
4. Kies Bestand importeren en selecteer SVD en/of SVL. Meerdere bestanden tegelijk kiezen kan.

Nieuw:
- SVD: terreinmodel met behouden broncoordinaten, hoogtes en TIN-verbindingen.
- Dubbele driehoeken in overlappende SVD-tegels worden eenmaal opgenomen.
- SVL: aparte 2D-ondergrondlaag met kleur, zichtbaarheid en transparantie.
- SVL-bogen worden benaderd met koorden (doelafwijking maximaal 1 mm).
- SVL-lijnwerk wordt gebundeld getekend om grote bestanden vlot weer te geven.
- SVL heeft in de geteste bestanden geen meethoogtes: het wordt nooit als bodem voor volumes gebruikt.
- SVL-teksten worden overgeslagen; het aantal wordt gemeld.
- Experimentele ondersteuning voor de onderzochte SiteVision 0x0601-indeling,
  geproduceerd met CTCT SiteVision generator 7.6.0.197 voor GCS900 v13.
- Onbekende versies, 3D-recordindelingen en ongeldige bestanden geven een importfout.
- Bij meerdere bestanden blijft een geslaagde import beschikbaar als een ander bestand mislukt.
- LandXML: noord/east/hoogte correct vertaald naar X/Y/Z en inactieve vlakken (i=1) overgeslagen.

Beperkingen:
- Ondersteuning voor andere SVD/SVL-versies is niet bevestigd.
- SVD-bestanden met meerdere hoogtelagen worden nog niet ondersteund.
- SVL wordt als een 2D-ondergrond getoond, zonder originele objectkleuren of teksten.
- Geen coordinatentransformatie of verwerking van CAL/CFG; bestanden moeten hetzelfde stelsel gebruiken.
- De bijgeleverde importlezer is eigen code; ODA Survey SDK is niet nodig.
- Dit is een bouwpakket, geen vooraf gebouwde Windows-installer.
- Automatische publicatie naar GitHub is niet uitgevoerd.

Controle met de aangeleverde voorbeelden:
- Test.svd: 24 tegels, 9.080 unieke punten, 16.653 unieke driehoeken;
  1.004 herhaalde tegeldriehoeken verwijderd.
- Test.svl: 55.637 lijnobjecten, waaronder 566 bogen; 2 teksten overgeslagen.
- SVD-oppervlakte: 23.981,414650 m2. Actieve LandXML-oppervlakte: 23.981,414650 m2.
- Alle 16.653 SVD-driehoekmiddelpunten liggen binnen het actieve LandXML-model.
- Hoogtevergelijking op deze middelpunten: gemiddelde absolute afwijking circa 1,18 mm;
  grootste absolute afwijking circa 0,3153 m; 1.690 punten verschillen meer dan 1 mm.
  De oorzaak van deze plaatselijke afwijkingen is niet definitief vastgesteld.
  De SVD-import behoudt de eigen driehoeken en maakt geen nieuwe TIN vanuit de punten.
  Controleer de experimentele SVD-weergave tegen de oorspronkelijke Trimble-weergave
  voordat je hier productievolumes of uitvoeringsbeslissingen op baseert.
- Geautomatiseerd gecontroleerd: topologie, dubbele vlakken, oppervlakte,
  parserverwijzingen, afgebroken bestanden, onbekende versies/records,
  import via de werkelijke bestands-eventhandler in beide volgordes,
  herhaald importeren, foutafhandeling en uitsluiting SVL uit hoogtemetingen.
- WebGL-schermcontrole kon in de uitvoeromgeving niet worden uitgevoerd.
  De Windows-installer is hier niet gebouwd of op Windows getest.

Historische notities vorige versie:

VDBH TERREIN VIEWER BETA 0.2.59

Aanpassing herkenning Depot / Volume:
- De volledige boundary wordt op meerdere punten bemonsterd; niet alleen het middelpunt.
- Minimaal 70% positieve hoogteverschillen: Depot.
- Minimaal 70% negatieve hoogteverschillen: Volume.
- Bij gemengde resultaten verschijnt Gemengd / kies. In de resultatenlijst kan het type handmatig op Depot of Volume worden gezet.
- De numerieke volume-integratie is niet gewijzigd.

Bouwen:
1. Pak dit ZIP-bestand volledig uit.
2. Start build-windows.bat.
3. De Windows-installer verschijnt in de map dist.

Test met eigen DXF- en LandXML-bestanden voordat deze versie in productie wordt gebruikt.

BETA 0.2.59: vernieuwde A4 PDF-export met verplichte projectgegevens, officiële VDBH-huisstijl, depotdetails en maximaal twee depotvisualisaties per A4-pagina.

PDF-export 0.2.59: depotvisualisaties hebben een vaste kaartgrootte; maximaal twee kaarten per A4-pagina. Bij meer depots worden automatisch vervolgpagina’s toegevoegd.

PDF-export 0.2.59:
- Alle depotvisualisaties gebruiken één gezamenlijke schaalfactor; ieder depot wordt binnen het vaste kader gecentreerd.
- De schaal wordt bepaald op basis van het grootste depot, zodat alle depotgrenzen volledig zichtbaar blijven.
- Iedere visualisatie toont een schaalbalk die overeenkomt met de gezamenlijke kaartschaal.
- De officiële aangeleverde noordpijl wordt op iedere kaart identiek weergegeven.
- De verticale scheidingslijn direct naast het logo in de PDF-header is verwijderd.

Wijziging BETA 0.2.59: volume-eenheid expliciet als m³ in de tabelkop, depotregels, totalen en depotkaarten.
