# Download Nunito Fonts

## Option 1: Using npm (Recommended)

Run this command to download Nunito fonts:

```bash
npm install --save-dev google-webfonts-helper
```

Then run this script to download the fonts:

```bash
npx google-webfonts-helper download nunito --weights 400,600,700 --output-dir ./assets/fonts --formats ttf
```

## Option 2: Direct Download from Google Fonts

1. Visit: https://fonts.google.com/specimen/Nunito
2. Click "Download family" button
3. Extract the ZIP file
4. Copy these TTF files to `assets/fonts/`:
   - `Nunito-Regular.ttf` (400 weight)
   - `Nunito-SemiBold.ttf` (600 weight) 
   - `Nunito-Bold.ttf` (700 weight)

## Option 3: Manual Download Script

If you have curl installed, you can download directly:

```bash
# Create fonts directory if it doesn't exist
mkdir -p assets/fonts

# Download Nunito Regular
curl -L "https://github.com/google/fonts/raw/main/ofl/nunito/Nunito-Regular.ttf" -o assets/fonts/Nunito-Regular.ttf

# Download Nunito SemiBold
curl -L "https://github.com/google/fonts/raw/main/ofl/nunito/Nunito-SemiBold.ttf" -o assets/fonts/Nunito-SemiBold.ttf

# Download Nunito Bold
curl -L "https://github.com/google/fonts/raw/main/ofl/nunito/Nunito-Bold.ttf" -o assets/fonts/Nunito-Bold.ttf
```

**For Windows PowerShell:**
```powershell
New-Item -ItemType Directory -Force -Path assets\fonts
Invoke-WebRequest -Uri "https://github.com/google/fonts/raw/main/ofl/nunito/Nunito-Regular.ttf" -OutFile "assets\fonts\Nunito-Regular.ttf"
Invoke-WebRequest -Uri "https://github.com/google/fonts/raw/main/ofl/nunito/Nunito-SemiBold.ttf" -OutFile "assets\fonts\Nunito-SemiBold.ttf"
Invoke-WebRequest -Uri "https://github.com/google/fonts/raw/main/ofl/nunito/Nunito-Bold.ttf" -OutFile "assets\fonts\Nunito-Bold.ttf"
```

After downloading, restart your Expo development server.
