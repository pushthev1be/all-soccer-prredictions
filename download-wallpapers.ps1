# Download 4K Soccer Wallpapers from free sources
# This script downloads high-quality soccer images for backgrounds

$outputDir = "public/images/backgrounds"

# Create directory if it doesn't exist
if (!(Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir -Force
}

# High-quality free soccer image URLs from Unsplash and Pexels
$images = @(
    @{
        url = "https://images.unsplash.com/photo-1556821552-5a63fe3e2e9f?w=2560&q=80"
        name = "stadium-aerial.jpg"
        desc = "Stadium aerial view"
    },
    @{
        url = "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=2560&q=80"
        name = "football-pattern.jpg"
        desc = "Football players action shot"
    },
    @{
        url = "https://images.unsplash.com/photo-1517747129245-d759a6b20e6e?w=2560&q=80"
        name = "stadium.jpg"
        desc = "Stadium close-up"
    }
)

foreach ($image in $images) {
    $path = Join-Path $outputDir $image.name
    Write-Host "Downloading: $($image.desc)"
    Write-Host "  URL: $($image.url)"
    Write-Host "  Saving to: $path"
    
    try {
        # Download the image
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        Invoke-WebRequest -Uri $image.url -OutFile $path -UseBasicParsing
        Write-Host "  ✓ Downloaded successfully" -ForegroundColor Green
    } catch {
        Write-Host "  ✗ Failed: $_" -ForegroundColor Red
    }
}

Write-Host "`nDone! Images are ready in $outputDir" -ForegroundColor Green
