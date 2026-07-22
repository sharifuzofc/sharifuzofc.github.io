# Minimal static file server for local preview (run: powershell -File serve.ps1)
$root = $PSScriptRoot
$port = 8080
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()
Write-Host "Serving $root at http://localhost:$port/"

$mime = @{
    ".html"="text/html"; ".css"="text/css"; ".js"="application/javascript";
    ".svg"="image/svg+xml"; ".png"="image/png"; ".jpg"="image/jpeg";
    ".jpeg"="image/jpeg"; ".gif"="image/gif"; ".ico"="image/x-icon";
    ".json"="application/json"; ".woff"="font/woff"; ".woff2"="font/woff2"
}

while ($listener.IsListening) {
    $context = $listener.GetContext()
    $path = [System.Uri]::UnescapeDataString($context.Request.Url.AbsolutePath)
    if ($path -eq "/") { $path = "/index.html" }
    $file = Join-Path $root ($path -replace "/", "\")
    if ((Test-Path $file -PathType Leaf) -and ([System.IO.Path]::GetFullPath($file)).StartsWith($root)) {
        $bytes = [System.IO.File]::ReadAllBytes($file)
        $ext = [System.IO.Path]::GetExtension($file).ToLower()
        $context.Response.ContentType = if ($mime[$ext]) { $mime[$ext] } else { "application/octet-stream" }
        $context.Response.ContentLength64 = $bytes.Length
        $context.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
        $context.Response.StatusCode = 404
        $msg = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
        $context.Response.OutputStream.Write($msg, 0, $msg.Length)
    }
    $context.Response.OutputStream.Close()
    Write-Host "$($context.Response.StatusCode) $path"
}
