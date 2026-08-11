Get-ChildItem -Filter *.html | Where-Object { $_.Name -ne 'index.html' -and $_.Name -ne 'contact-us.html' } | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    if ($content -match 'hero--inner' -and $content -notmatch 'Contact Us <span class="arw">') {
        $content = $content -replace '(?s)\s*</div>\s*<div class="hero-marks"', "`n    <div class=`"hero-actions`" data-hero-fade style=`"margin-top:2rem`"><a class=`"btn`" href=`"contact-us.html`">Contact Us <span class=`"arw`">&rarr;</span></a></div>`n  </div>`n  <div class=`"hero-marks`""
        Set-Content $_.FullName $content
        Write-Output "Updated $($_.Name)"
    }
}
