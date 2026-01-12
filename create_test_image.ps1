# Create a simple PNG image for testing
[reflection.assembly]::LoadWithPartialName('System.Drawing') | Out-Null

$img = New-Object System.Drawing.Bitmap(200, 150)
$g = [System.Drawing.Graphics]::FromImage($img)
$brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::Blue)
$g.FillRectangle($brush, 0, 0, 200, 150)

$font = New-Object System.Drawing.Font('Arial', 16, [System.Drawing.FontStyle]::Bold)
$textBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
$g.DrawString('GradMemories Test', $font, $textBrush, 20, 60)

$g.Dispose()
$img.Save('test_image.png')
Write-Host 'Imagen creada: test_image.png (200x150)'
$img.Dispose()
