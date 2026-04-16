# Facebook Clone with Neo4j

**Öğrenci:** Ahmet Karaman  
**Okul No:** 2021XXX

---

## 📋 Proje Açıklaması

Bu proje, Neo4j graf veritabanı kullanılarak geliştirilmiş bir Facebook Clone backend uygulamasıdır. Sosyal ağ uygulamalarının temel problemi olan ilişki yönetimini graf veritabanında çözümler. Node.js + Express backend, Neo4j graf veritabanı ve modern bir frontend arayüzü içerir. Docker Compose ile tek komutla ayağa kalkar.

**Kullanılan Teknolojiler:**
- **Backend:** Node.js, Express.js
- **Veritabanı:** Neo4j (Graf Veritabanı)
- **Frontend:** HTML, CSS, JavaScript (Vanilla)
- **Containerization:** Docker, Docker Compose

---

## 🚀 Hızlı Başlangıç

```bash
# 1. Projeyi klonla
git clone <repo-url> && cd facebook-clone-neo4j

# 2. Sistemi başlat
docker compose up -d --build

# 3. Sağlık kontrolü (60 saniye bekle)
curl http://localhost:3000/health

# 4. Neo4j Browser
# http://localhost:7474 (neo4j / password123)
```

---

## 📡 API Endpoint Listesi

### Sağlık Kontrolü
```bash
GET /health
# Response: { "status": "ok", "neo4j": "connected" }
```

### Kullanıcı İşlemleri
```bash
# Kayıt
POST /register
Content-Type: application/json
{"username": "alice", "display_name": "Alice Johnson"}
# Response: 201 Created

# Profil görüntüleme
GET /users/alice
# Response: { "username": "alice", "display_name": "Alice Johnson", "friend_count": 5 }

# Kullanıcının arkadaşları
GET /users/alice/friends
```

### Arkadaşlık İşlemleri
```bash
# Arkadaşlık isteği gönder
POST /friend-request
{"from": "alice", "to": "bob"}

# Arkadaşlık isteğini kabul et
POST /friend-accept
{"from": "alice", "to": "bob"}
```

### Post İşlemleri
```bash
# Post paylaş
POST /posts
{"username": "alice", "content": "Merhaba dünya!", "visibility": "friends"}

# Kullanıcının postları
GET /users/alice/posts

# Feed (görünürlük kontrollü)
GET /feed/alice

# Post beğen
POST /posts/<post_id>/like
{"username": "bob"}
```

### Graf Traversal
```bash
# Arkadaşın arkadaşları
GET /users/alice/friends-of-friends

# Ortak arkadaşlar
GET /users/alice/mutual-friends/bob

# Arkadaş önerisi
GET /users/alice/suggestions
```

### Mesajlaşma
```bash
# Mesaj gönder (sadece arkadaş veya arkadaşın arkadaşı)
POST /messages
{"from": "alice", "to": "bob", "content": "Merhaba!"}

# Mesajları görüntüle
GET /messages/alice
```

---

## 🗂 Graf Şema Açıklaması

### Node Labels (Düğüm Tipleri)

| Label   | Açıklama | Properties |
|---------|----------|------------|
| Person  | Kullanıcı | username (UNIQUE), display_name, bio, avatar_url, created_at |
| Post    | Paylaşım  | post_id (UNIQUE), content, visibility, created_at |
| Message | Mesaj     | message_id (UNIQUE), content, created_at, read |

### Relationship Types (İlişki Tipleri)

| İlişki | Yön | Açıklama | Properties |
|--------|-----|----------|------------|
| FRIEND | Person ↔ Person | Arkadaşlık (iki yönlü) | since |
| FRIEND_REQUEST | Person → Person | Arkadaşlık isteği | sent_at |
| POSTED | Person → Post | Post paylaşımı | - |
| LIKED  | Person → Post | Post beğeni | liked_at |
| SENT   | Person → Message | Mesaj gönderme | to |

### Görünürlük Kontrolü (visibility)

- **public** → Herkes görebilir
- **friends** → Sadece direkt arkadaşlar
- **friends_of_friends** → Arkadaşlar + arkadaşın arkadaşları  
- **private** → Sadece post sahibi

### Graf Traversal Örnekleri

```cypher
-- Arkadaşın arkadaşları (2 hop)
MATCH (me:Person {username: "ali"})-[:FRIEND*2]-(fof:Person)
WHERE NOT (me)-[:FRIEND]-(fof) AND fof <> me
RETURN DISTINCT fof.username

-- Mesaj yetkisi kontrolü (1-2 hop)
MATCH path = shortestPath((a:Person)-[:FRIEND*1..2]-(b:Person))
RETURN path IS NOT NULL AS can_message
```

---

## 📁 Proje Yapısı

```
hafta8/
├── README.md
├── docker-compose.yml
├── init.cypher
├── .env.example
├── .gitignore
├── requests.http
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── server.js
│       ├── db/
│       │   └── neo4j.js
│       └── routes/
│           ├── users.js
│           ├── posts.js
│           ├── messages.js
│           └── graph.js
└── frontend/
    └── index.html
```
