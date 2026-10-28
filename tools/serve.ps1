# Prosty serwer statyczny (Windows bez Pythona): powershell -ExecutionPolicy Bypass -File tools\serve.ps1
# Strona: http://localhost:8765/index.html
param([int]$Port = 8765, [switch]$Open)
if ($env:PORT) { $Port = [int]$env:PORT }
$root = Split-Path -Parent $PSScriptRoot
$mime = @{ '.html'='text/html; charset=utf-8'; '.js'='text/javascript; charset=utf-8'; '.css'='text/css; charset=utf-8'; '.json'='application/json'; '.wasm'='application/wasm'; '.png'='image/png'; '.jpg'='image/jpeg'; '.gif'='image/gif'; '.svg'='image/svg+xml'; '.sql'='text/plain; charset=utf-8'; '.txt'='text/plain; charset=utf-8' }
$l = New-Object System.Net.HttpListener
$l.Prefixes.Add("http://localhost:$Port/")
$l.Start()
Write-Host "Serwer dziala: http://localhost:$Port/index.html (zamknij to okno, zeby wylaczyc)"
if ($Open) { Start-Process "http://localhost:$Port/index.html" }
while ($l.IsListening) {
  $ctx = $l.GetContext()
  $path = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath).TrimStart('/')
  if (-not $path) { $path = 'index.html' }
  $file = [IO.Path]::GetFullPath((Join-Path $root $path))
  $res = $ctx.Response
  if ($file.StartsWith($root) -and (Test-Path $file -PathType Leaf)) {
    $ext = [IO.Path]::GetExtension($file).ToLower()
    $res.ContentType = if ($mime[$ext]) { $mime[$ext] } else { 'application/octet-stream' }
    $bytes = [IO.File]::ReadAllBytes($file)
    $res.ContentLength64 = $bytes.Length
    $res.OutputStream.Write($bytes, 0, $bytes.Length)
  } else { $res.StatusCode = 404 }
  $res.Close()
}
