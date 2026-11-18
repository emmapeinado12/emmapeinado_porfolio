# Reduce un GIF animado conservando la animación, los retardos y el bucle.
# Hace falta porque los GIF salidos de After Effects vienen al tamaño de
# imprenta: el de las banderolas pesaba 11 MB a 4500 px para verse a 1400.
#
#   powershell -File herramientas\reducir-gif.ps1 "origen.gif" "destino.gif" 1400
#
param(
  [Parameter(Mandatory=$true)][string]$Origen,
  [Parameter(Mandatory=$true)][string]$Destino,
  [int]$AnchoMax = 1400
)

Add-Type -AssemblyName System.Drawing

$src = [System.Drawing.Image]::FromFile((Resolve-Path $Origen))
$dim = New-Object System.Drawing.Imaging.FrameDimension($src.FrameDimensionsList[0])
$total = $src.GetFrameCount($dim)

$escala = $AnchoMax / $src.Width
if ($escala -ge 1) { $escala = 1 }
$w = [int][Math]::Round($src.Width * $escala)
$h = [int][Math]::Round($src.Height * $escala)

# Los retardos de cada fotograma (0x5100) y el número de vueltas (0x5101)
# viajan en los metadatos: si no se copian, el GIF sale a toda velocidad
# o se queda en el primer fotograma.
$retardos = $null; $bucle = $null
try { $retardos = $src.GetPropertyItem(0x5100) } catch {}
try { $bucle    = $src.GetPropertyItem(0x5101) } catch {}

$codificador = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
               Where-Object { $_.FormatID -eq [System.Drawing.Imaging.ImageFormat]::Gif.Guid }

$marcos = @()
for ($i = 0; $i -lt $total; $i++) {
  $src.SelectActiveFrame($dim, $i) | Out-Null
  $bmp = New-Object System.Drawing.Bitmap($w, $h, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.PixelOffsetMode   = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.SmoothingMode     = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.DrawImage($src, (New-Object System.Drawing.Rectangle(0, 0, $w, $h)))
  $g.Dispose()
  $marcos += $bmp
}
$src.Dispose()

$primero = $marcos[0]
if ($retardos) { $primero.SetPropertyItem($retardos) }
if ($bucle)    { $primero.SetPropertyItem($bucle) }

$ep = New-Object System.Drawing.Imaging.EncoderParameters(1)
$ep.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter(
  [System.Drawing.Imaging.Encoder]::SaveFlag,
  [int][System.Drawing.Imaging.EncoderValue]::MultiFrame)
$primero.Save((Join-Path (Get-Location) $Destino), $codificador, $ep)

$epAdd = New-Object System.Drawing.Imaging.EncoderParameters(1)
$epAdd.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter(
  [System.Drawing.Imaging.Encoder]::SaveFlag,
  [int][System.Drawing.Imaging.EncoderValue]::FrameDimensionTime)
for ($i = 1; $i -lt $marcos.Count; $i++) { $primero.SaveAdd($marcos[$i], $epAdd) }

$epFin = New-Object System.Drawing.Imaging.EncoderParameters(1)
$epFin.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter(
  [System.Drawing.Imaging.Encoder]::SaveFlag,
  [int][System.Drawing.Imaging.EncoderValue]::Flush)
$primero.SaveAdd($epFin)

foreach ($m in $marcos) { $m.Dispose() }

$antes  = (Get-Item $Origen).Length / 1MB
$ahora  = (Get-Item $Destino).Length / 1MB
"{0}: {1} fotogramas, {2} px -> {3} px, {4:N1} MB -> {5:N1} MB" -f `
  (Split-Path $Destino -Leaf), $total, [int]($w / $escala), $w, $antes, $ahora
