# Reduce una imagen fija al tamaño en que se usa de verdad en la web.
# Las fotos vienen a resolución de imprenta (3000-4500 px) y se muestran
# a 1400 o 2200: sin reducirlas el navegador se atasca decodificándolas.
#
#   powershell -File herramientas\reducir.ps1 "origen.jpg" "destino.jpg" 2200
#   powershell -File herramientas\reducir.ps1 "origen.png" "destino.png" 1800
#
# El formato sale de la extensión del destino. Con .jpg se puede ajustar la
# calidad; con .png se conserva la transparencia.
#
param(
  [Parameter(Mandatory=$true)][string]$Origen,
  [Parameter(Mandatory=$true)][string]$Destino,
  [int]$AnchoMax = 2200,
  [int]$Calidad = 84
)

Add-Type -AssemblyName System.Drawing

$src = [System.Drawing.Image]::FromFile((Resolve-Path $Origen))
$escala = $AnchoMax / $src.Width
if ($escala -ge 1) { $escala = 1 }
$w = [int][Math]::Round($src.Width * $escala)
$h = [int][Math]::Round($src.Height * $escala)

$bmp = New-Object System.Drawing.Bitmap($w, $h, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.InterpolationMode    = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.PixelOffsetMode      = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.SmoothingMode        = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.CompositingQuality   = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
$g.Clear([System.Drawing.Color]::Transparent)
$g.DrawImage($src, (New-Object System.Drawing.Rectangle(0, 0, $w, $h)))
$g.Dispose()

$ruta = Join-Path (Get-Location) $Destino
if ($Destino -match '\.png$') {
  $bmp.Save($ruta, [System.Drawing.Imaging.ImageFormat]::Png)
} else {
  # El JPEG no tiene transparencia: lo que fuera transparente se aplana
  # sobre blanco, que es el fondo de la página.
  $plano = New-Object System.Drawing.Bitmap($w, $h, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
  $g2 = [System.Drawing.Graphics]::FromImage($plano)
  $g2.Clear([System.Drawing.Color]::White)
  $g2.DrawImage($bmp, 0, 0, $w, $h)
  $g2.Dispose()
  $cod = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
         Where-Object { $_.FormatID -eq [System.Drawing.Imaging.ImageFormat]::Jpeg.Guid }
  $ep = New-Object System.Drawing.Imaging.EncoderParameters(1)
  $ep.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter(
    [System.Drawing.Imaging.Encoder]::Quality, [long]$Calidad)
  $plano.Save($ruta, $cod, $ep)
  $plano.Dispose()
}
$bmp.Dispose(); $src.Dispose()

$antes = (Get-Item $Origen).Length / 1KB
$ahora = (Get-Item $Destino).Length / 1KB
"{0,-28} {1} px, {2:N0} KB -> {3:N0} KB" -f (Split-Path $Destino -Leaf), $w, $antes, $ahora
