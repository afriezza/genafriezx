# genafriezx — FreeFire guest generator (live engine)

Engine asli: register -> token:grant -> MajorRegister -> MajorLogin (loginbp.ppmainecoonghj.com). Node 18+, zero dependency, semua akun nyata (uid + password + account_id + JWT).

## Endpoints

- `/gen?name=Afzx&count=5&region=ID&password_prefix=GG&ghost=false&detect_rare=true&bind=false`
- `/bulk?name=Afzx&count=100&region=ID&chunk=20` — pecah jadi banyak lambda paralel
- `/patterns` — daftar regex rare
- `/health` — cek hidup + version

## Response account

```json
{
  "uid": "83...",
  "password": "32hex",
  "name": "AFZX1234",
  "account_id": "188...",
  "jwt_token": "eyJ...",
  "access_token": "...",
  "open_id": "...",
  "region": "ID",
  "rare": ["S4"],
  "ghost": false,
  "ms": 2600
}
```

Semua request paralel di dalam lambda (count x jalur sekaligus), jadi 20 akun tetap selesai di kisaran 3-6 detik. bulk memecah count ke beberapa lambda supaya lebih banyak tembakan serentak.

Deploy: push ke GitHub (project Vercel `genafriezx` terhubung ke repo ini, auto-deploy production).
