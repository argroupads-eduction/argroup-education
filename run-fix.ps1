$root = "c:\Users\akash\OneDrive\Desktop\ARGROUP OF EDUCTION"
Set-Location $root
$log = @()
$d = Get-CimInstance Win32_LogicalDisk -Filter "DeviceID='C:'"
$log += "C: drive free: $([math]::Round($d.FreeSpace/1GB, 2)) GB / $([math]::Round($d.Size/1GB, 2)) GB"
git checkout HEAD -- apps/frontend/lib/mbbsIndiaTree.ts apps/frontend/lib/mbbsAbroadTree.ts
$files = @('apps/frontend/lib/mbbsIndiaTree.ts','apps/frontend/lib/mbbsAbroadTree.ts')
foreach ($f in $files) {
  $c = Get-Content $f -Raw
  $c = $c -replace 'image: resolveCollegeImageUrl\(college\.slug, college\.image\) \?\? college\.image,', 'image: resolveCollegeImageUrl(college.slug, college.image),'
  Set-Content -Path $f -Value $c -NoNewline
  $item = Get-Item $f
  $log += "$($item.Name) size $($item.Length) bytes"
  $line = (Select-String -Path $f -Pattern 'resolveCollegeImageUrl').Line
  $log += "  $line"
}
foreach ($script in @('build:mbbs-india','build:mbbs-abroad','wp:build:college-images')) {
  $log += "Running npm run $script"
  npm run $script 2>&1 | Out-String | ForEach-Object { $log += $_ }
}
$slug = 'noida-international-institute-of-medical-sciences'
foreach ($name in @('mbbs-india-tree.json','college-image-index.json')) {
  $found = Get-ChildItem -Path $root -Recurse -Filter $name -ErrorAction SilentlyContinue | Select-Object -First 1
  if (-not $found) { $log += "$name not found"; continue }
  $log += "$name at $($found.FullName)"
  $txt = Get-Content $found.FullName -Raw
  $idx = $txt.IndexOf($slug)
  if ($idx -lt 0) { $log += "  slug not in file" }
  else {
    $snip = $txt.Substring($idx, [Math]::Min(350, $txt.Length - $idx))
    $log += "  snippet: $snip"
    $near = $txt.Substring([Math]::Max(0,$idx-150), [Math]::Min(650, $txt.Length - [Math]::Max(0,$idx-150)))
    $bad = ($near -match 'Untitled|mbbs-in-russia')
    $log += "  Untitled/mbbs-in-russia near slug: $bad"
  }
}
$log | Set-Content -Path "$root\SUBAGENT-RESULTS.txt" -Encoding UTF8
$log | Out-String
