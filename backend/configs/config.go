package configs

import (
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	Database DatabaseConfig
	Server   ServerConfig
	JWT      JWTConfig
	Upload   UploadConfig
}

type DatabaseConfig struct {
	Host     string
	Port     string
	Name     string
	User     string
	Password string
}

type ServerConfig struct {
	Port    string
	BaseURL string
}

type JWTConfig struct {
	Secret string
}

type UploadConfig struct {
	Path          string
	MaxUploadSize int64
}

func LoadConfig() *Config {
	// Load .env file if it exists
	godotenv.Load()

	maxUploadSize, _ := strconv.ParseInt(getEnv("MAX_UPLOAD_SIZE", "52428800"), 10, 64) // 50MB default

	return &Config{
		Database: DatabaseConfig{
			Host:     getEnv("DB_HOST", "localhost"),
			Port:     getEnv("DB_PORT", "3306"),
			User:     getEnv("DB_USER", "root"),
			Password: getEnv("DB_PASSWORD", "rootpassword"),
			Name:     getEnv("DB_NAME", "e_repository_db"),
		},
		Server: ServerConfig{
			Port:    getEnv("PORT", "8080"),
			BaseURL: getEnv("BASE_URL", "http://localhost:8080"),
		},
		JWT: JWTConfig{
			Secret: getEnv("JWT_SECRET", "your_secure_jwt_secret_key_here"),
		},
		Upload: UploadConfig{
			Path:          getEnv("UPLOAD_PATH", "./uploads"),
			MaxUploadSize: maxUploadSize,
		},
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
