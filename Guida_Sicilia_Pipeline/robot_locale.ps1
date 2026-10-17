# Robot locale della guida — gira settimanale via Utilità di pianificazione.
# Fa: audit (buchi/tag) + ricostruisce il sito (Sicilia + Napoli) + deploy su Firebase.
# NON aggiunge né promuove posti: la scelta del meglio resta umana (vedi CRITERI.md).
# Gratis, nessun GitHub, nessun token (usa il login firebase già presente su questo PC).

$ErrorActionPreference = 'Continue'
$pipeline = 'C:\Users\lucad\Downloads\guida-viaggio\Guida_Sicilia_Pipeline'
$sito     = 'C:\Users\lucad\Downloads\guida-viaggio\Guida_Sicilia_Sito'
$node     = 'C:\Program Files\nodejs\node.exe'
$firebase = 'C:\Users\lucad\AppData\Roaming\npm\firebase.cmd'
$log      = Join-Path $pipeline 'robot_locale.log'

"==== $(Get-Date -Format 'yyyy-MM-dd HH:mm') : avvio robot ====" | Out-File -Append -Encoding utf8 $log
Set-Location $pipeline

& $node audit_categorie.js  2>&1 | Out-File -Append -Encoding utf8 $log
& $node build.js            2>&1 | Out-File -Append -Encoding utf8 $log
& $node crediti.js          2>&1 | Out-File -Append -Encoding utf8 $log
& $node build_napoli.js     2>&1 | Out-File -Append -Encoding utf8 $log

Set-Location $sito
& $firebase deploy --only hosting --project guida-sicilia-2026 --non-interactive 2>&1 | Out-File -Append -Encoding utf8 $log

"==== $(Get-Date -Format 'yyyy-MM-dd HH:mm') : fine ====`n" | Out-File -Append -Encoding utf8 $log
