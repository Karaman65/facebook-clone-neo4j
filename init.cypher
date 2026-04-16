// ==========================================
// CONSTRAINT'ler (Unique + Index)
// ==========================================

CREATE CONSTRAINT person_username IF NOT EXISTS
FOR (p:Person) REQUIRE p.username IS UNIQUE;

CREATE CONSTRAINT post_id IF NOT EXISTS
FOR (p:Post) REQUIRE p.post_id IS UNIQUE;

CREATE CONSTRAINT message_id IF NOT EXISTS
FOR (m:Message) REQUIRE m.message_id IS UNIQUE;

// ==========================================
// DÜĞÜM TİPLERİ (Labels)
// ==========================================

// Person (Kullanıcı)
// Properties: username, display_name, bio, avatar_url, created_at

// Post (Paylaşım)
// Properties: post_id, content, visibility ("public"|"friends"|"friends_of_friends"|"private"), created_at

// Message (Mesaj)
// Properties: message_id, content, created_at, read (boolean)

// ==========================================
// İLİŞKİ TİPLERİ (Relationship Types)
// ==========================================

// (:Person)-[:FRIEND]->(:Person)
//   Properties: since (tarih)
//   NOT: İki yönlü arkadaşlık için HER İKİ YÖNDE de FRIEND oluştur
//   veya tek yönlü oluşturup sorguyu yönsüz yap: (a)-[:FRIEND]-(b)

// (:Person)-[:FRIEND_REQUEST]->(:Person)
//   Properties: sent_at
//   Tek yönlü: gönderen -> alıcı

// (:Person)-[:POSTED]->(:Post)
//   Tek yönlü: yazar -> post

// (:Person)-[:LIKED]->(:Post)
//   Properties: liked_at
//   Tek yönlü: beğenen -> post

// (:Person)-[:SENT]->(:Message)
//   Properties: to (alıcı username)
//   Tek yönlü: gönderen -> mesaj

// ==========================================
// ÖRNEK VERİLER (Opsiyonel)
// ==========================================

// Örnek kullanıcılar oluşturulabilir:
// CREATE (a:Person {username: "ali", display_name: "Ali Yılmaz", created_at: datetime()})
// CREATE (b:Person {username: "elif", display_name: "Elif Demir", created_at: datetime()})
