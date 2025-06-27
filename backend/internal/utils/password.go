package utils

import (
	"log"

	"golang.org/x/crypto/bcrypt"
)

// HashPassword generates a bcrypt hash of the password
func HashPassword(password string) (string, error) {
	log.Printf("Hashing password...")
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		log.Printf("Password hashing failed: %v", err)
		return "", err
	}
	log.Printf("Password hashed successfully")
	return string(bytes), nil
}

// CheckPasswordHash compares a bcrypt hashed password with its possible plaintext equivalent
func CheckPasswordHash(password, hash string) bool {
	log.Printf("Checking password hash...")
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	if err != nil {
		log.Printf("Password verification failed: %v", err)
		return false
	}
	log.Printf("Password verified successfully")
	return true
}
