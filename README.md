Real-Time Lojistik ve Filo Takip Sistemi
Bu proje; Kafka, Redis, PostgreSQL ve NestJS kullanılarak geliştirilmiş, gerçek zamanlı bir veri işleme ve takip sistemidir. Araçlardan gelen anlık konum verilerini bir veri hattı üzerinden haritaya aktarır.

Teknik Mimari
Proje beş ana katmandan oluşmaktadır:

Frontend (React ve Leaflet.js): Araçların harita üzerinde akıcı hareketlerle takibi ve görselleştirilmesi.

Backend API (NestJS ve Socket.io): Verilerin istemciye anlık iletilmesini sağlayan WebSocket katmanı.

Data Ingestion (Kafka Consumer): Kafka'dan gelen mesajları okuyup Redis ve Postgres'e dağıtan servis.

Message Broker (Apache Kafka ve Zookeeper): Veri trafiğini yöneten ve sistemler arası gevşek bağlılığı sağlayan mesaj kuyruğu.

Storage (PostgreSQL ve Redis): PostgreSQL tüm rota geçmişini saklarken, Redis araçların son konum bilgisini hızlı sorgu için tutar.

Teknik Özellikler
Dinamik Çizgi Temizliği: Kullanıcı farklı bir araca tıkladığında eski rotalar temizlenir ve harita yeni araca odaklanır.

Titreme Önleme (Anti-Jitter): GPS verilerindeki mikro sapmaları filtreleyen ve koordinat yuvarlama teknikleriyle akıcı görüntü sağlayan algoritmalar.

Güvenli Bölge (Geofencing): Belirlenen koordinat sınırları dışına çıkan araçlar için sistem üzerinden uyarı üretilir.

Hibrit Veri Yönetimi: Hızlı sorgular için RAM tabanlı (Redis), kalıcı kayıtlar için disk tabanlı (PostgreSQL) depolama.

Kurulum ve Çalıştırma
Altyapıyı başlatmak için ana dizinde: docker-compose up -d

Servisleri (Ingestion, API, Simulator) başlatmak için her birinin klasöründe: npm install npm run start:dev

Frontend uygulamasını başlatmak için: cd tracking-client npm install npm run start
