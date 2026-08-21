# Sweet Seventeen Template Repository

Repository ini dibuat khusus agar template Sweet Seventeen bisa berdiri sendiri
tanpa mengubah repository utama `wedding-invitation`.

## Isi
- index.html
- style.css
- script.js
- functions/api/events.js
- functions/api/comments.js

## Cloudflare binding yang wajib
Tambahkan binding D1:

Variable name:
DB

Database:
wedding-comments

Template ini hanya membaca data event dari D1 dan membaca/menulis komentar.
Foto tetap dibaca dari URL R2 yang sudah tersimpan di database, jadi binding MEDIA
tidak diperlukan untuk repository template ini.

## Contoh URL
https://PROJECT-BARU.pages.dev/?event=vio-sweet17&to=Kadek

## Cara upload ke GitHub
1. Extract ZIP ini.
2. Buka repository GitHub baru.
3. Pilih Add file > Upload files.
4. Drag semua isi folder hasil extract.
5. Commit changes.
6. Hubungkan repository ke Cloudflare Pages.
7. Tambahkan binding DB -> wedding-comments.
8. Redeploy.
