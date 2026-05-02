#!/bin/bash
set -e

# ============================================
# FinNote iOS IPA Build Script
# ============================================

PROJECT_DIR="/Users/NhuTuan/smart_note"
IOS_DIR="$PROJECT_DIR/ios/App"
BUILD_DIR="$PROJECT_DIR/ios/build"
ARCHIVE_PATH="$BUILD_DIR/FinNote.xcarchive"
IPA_DIR="$BUILD_DIR/ipa"
EXPORT_OPTIONS="$PROJECT_DIR/ios/ExportOptions.plist"

echo "🏗️  FinNote iOS Build Script"
echo "================================"

# Step 1: Clean previous builds
echo ""
echo "🧹 Step 1: Cleaning previous builds..."
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"

# Step 2: Build web assets
echo ""
echo "📦 Step 2: Building web assets..."
cd "$PROJECT_DIR"
npm run build

# Step 3: Sync to iOS
echo ""
echo "🔄 Step 3: Syncing to iOS..."
npx cap sync ios

# Step 4: Archive
echo ""
echo "📱 Step 4: Archiving iOS app..."
cd "$IOS_DIR"
xcodebuild archive \
    -project App.xcodeproj \
    -scheme App \
    -configuration Release \
    -archivePath "$ARCHIVE_PATH" \
    -destination "generic/platform=iOS" \
    CODE_SIGN_IDENTITY="Apple Development" \
    CODE_SIGNING_ALLOWED=YES \
    -allowProvisioningUpdates \
    | tail -5

echo ""
echo "✅ Archive created at: $ARCHIVE_PATH"

# Step 5: Export IPA
echo ""
echo "📤 Step 5: Exporting IPA..."
xcodebuild -exportArchive \
    -archivePath "$ARCHIVE_PATH" \
    -exportOptionsPlist "$EXPORT_OPTIONS" \
    -exportPath "$IPA_DIR" \
    -allowProvisioningUpdates \
    | tail -5

echo ""
echo "============================================"
echo "🎉 BUILD COMPLETE!"
echo "============================================"
echo ""
echo "📁 IPA file location:"
ls -la "$IPA_DIR"/*.ipa 2>/dev/null || echo "   Check $IPA_DIR for output files"
echo ""
echo "📱 To install on iPhone:"
echo "   1. Connect iPhone via USB"
echo "   2. Open Finder → Select iPhone → Drag .ipa file"
echo "   OR"
echo "   3. Use: xcrun devicectl device install app --device <UDID> $IPA_DIR/App.ipa"
echo ""
