package utils

import (
	"bytes"
	"crypto/rand"
	"crypto/tls"
	"e-repository-api/configs"
	"encoding/hex"
	"fmt"
	"html/template"
	"net/smtp"
	"strings"
	"time"
)

// AllowedReceiverDomains defines the allowed email domains for receivers
var AllowedReceiverDomains = []string{"ac.id", "gmail.com", "yahoo.com", "hotmail.com", "outlook.com"}

// GenerateVerificationToken generates a random token for email verification
func GenerateVerificationToken() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

// ValidateReceiverEmail checks if the receiver's email is from an allowed domain
func ValidateReceiverEmail(email string) error {
	if !isValidEmail(email) {
		return fmt.Errorf("invalid email format")
	}

	// For testing purposes, allow any email domain
	// Uncomment the domain validation below when deploying to production

	// Extract domain from email
	// parts := strings.Split(email, "@")
	// if len(parts) != 2 {
	// 	return fmt.Errorf("invalid email format")
	// }
	// domain := parts[1]

	// // Check if domain is allowed
	// isValidDomain := false
	// for _, allowedDomain := range AllowedReceiverDomains {
	// 	if strings.HasSuffix(domain, allowedDomain) {
	// 		isValidDomain = true
	// 		break
	// 	}
	// }

	// if !isValidDomain {
	// 	return fmt.Errorf("email must be from an educational institution (.ac.id domain)")
	// }

	return nil
}

// SendVerificationEmail sends a verification email to the user
func SendVerificationEmail(to, token string, config *configs.EmailConfig) error {
	// Validate recipient email domain
	if err := ValidateReceiverEmail(to); err != nil {
		return fmt.Errorf("invalid recipient email: %v", err)
	}

	verificationLink := fmt.Sprintf("http://your-domain.com/verify-email?token=%s", token)

	// Load email template
	tmpl, err := template.ParseFiles("templates/verification_email.html")
	if err != nil {
		return fmt.Errorf("failed to parse email template: %v", err)
	}

	// Prepare email data
	data := struct {
		VerificationLink string
		ExpiryTime       string
	}{
		VerificationLink: verificationLink,
		ExpiryTime:       time.Now().Add(24 * time.Hour).Format("January 2, 2006 15:04:05"),
	}

	// Render email body
	var body bytes.Buffer
	if err := tmpl.Execute(&body, data); err != nil {
		return fmt.Errorf("failed to render email template: %v", err)
	}

	// Set up email headers
	headers := make(map[string]string)
	headers["From"] = fmt.Sprintf("%s <%s>", config.FromName, config.FromEmail)
	headers["To"] = to
	headers["Subject"] = "Verify Your Email Address - E-Repository"
	headers["MIME-Version"] = "1.0"
	headers["Content-Type"] = "text/html; charset=UTF-8"
	headers["Date"] = time.Now().Format(time.RFC1123Z)

	// Build email message
	var message bytes.Buffer
	for key, value := range headers {
		message.WriteString(fmt.Sprintf("%s: %s\r\n", key, value))
	}
	message.WriteString("\r\n")
	message.Write(body.Bytes())

	// Configure TLS
	tlsConfig := &tls.Config{
		InsecureSkipVerify: false,
		ServerName:         config.SMTPHost,
	}

	// Create SMTP connection
	conn, err := tls.Dial("tcp", fmt.Sprintf("%s:%s", config.SMTPHost, config.SMTPPort), tlsConfig)
	if err != nil {
		return fmt.Errorf("failed to establish TLS connection: %v", err)
	}
	defer conn.Close()

	// Create SMTP client
	client, err := smtp.NewClient(conn, config.SMTPHost)
	if err != nil {
		return fmt.Errorf("failed to create SMTP client: %v", err)
	}
	defer client.Close()

	// Authenticate
	auth := smtp.PlainAuth("", config.SMTPUsername, config.SMTPPassword, config.SMTPHost)
	if err := client.Auth(auth); err != nil {
		return fmt.Errorf("failed to authenticate: %v", err)
	}

	// Set sender and recipient
	if err := client.Mail(config.FromEmail); err != nil {
		return fmt.Errorf("failed to set sender: %v", err)
	}
	if err := client.Rcpt(to); err != nil {
		return fmt.Errorf("failed to set recipient: %v", err)
	}

	// Send email data
	w, err := client.Data()
	if err != nil {
		return fmt.Errorf("failed to prepare email data: %v", err)
	}
	defer w.Close()

	_, err = w.Write(message.Bytes())
	if err != nil {
		return fmt.Errorf("failed to write email data: %v", err)
	}

	return nil
}

// SendPasswordResetEmail sends a password reset email to the user
func SendPasswordResetEmail(to, token string, config *configs.EmailConfig) error {
	// Validate recipient email domain
	if err := ValidateReceiverEmail(to); err != nil {
		return fmt.Errorf("invalid recipient email: %v", err)
	}

	resetLink := fmt.Sprintf("http://localhost:3000/reset-password?token=%s", token)

	// Load email template
	tmpl, err := template.ParseFiles("templates/password_reset_email.html")
	if err != nil {
		return fmt.Errorf("failed to parse email template: %v", err)
	}

	// Prepare email data
	data := struct {
		ResetLink  string
		ExpiryTime string
	}{
		ResetLink:  resetLink,
		ExpiryTime: time.Now().Add(24 * time.Hour).Format("January 2, 2006 15:04:05"),
	}

	// Render email body
	var body bytes.Buffer
	if err := tmpl.Execute(&body, data); err != nil {
		return fmt.Errorf("failed to render email template: %v", err)
	}

	// Set up email headers
	headers := make(map[string]string)
	headers["From"] = fmt.Sprintf("%s <%s>", config.FromName, config.FromEmail)
	headers["To"] = to
	headers["Subject"] = "Reset Your Password - E-Repository"
	headers["MIME-Version"] = "1.0"
	headers["Content-Type"] = "text/html; charset=UTF-8"
	headers["Date"] = time.Now().Format(time.RFC1123Z)

	// Build email message
	var message bytes.Buffer
	for key, value := range headers {
		message.WriteString(fmt.Sprintf("%s: %s\r\n", key, value))
	}
	message.WriteString("\r\n")
	message.Write(body.Bytes())

	// Configure TLS
	tlsConfig := &tls.Config{
		InsecureSkipVerify: false,
		ServerName:         config.SMTPHost,
	}

	// Create SMTP connection
	conn, err := tls.Dial("tcp", fmt.Sprintf("%s:%s", config.SMTPHost, config.SMTPPort), tlsConfig)
	if err != nil {
		return fmt.Errorf("failed to establish TLS connection: %v", err)
	}
	defer conn.Close()

	// Create SMTP client
	client, err := smtp.NewClient(conn, config.SMTPHost)
	if err != nil {
		return fmt.Errorf("failed to create SMTP client: %v", err)
	}
	defer client.Close()

	// Authenticate
	auth := smtp.PlainAuth("", config.SMTPUsername, config.SMTPPassword, config.SMTPHost)
	if err := client.Auth(auth); err != nil {
		return fmt.Errorf("failed to authenticate: %v", err)
	}

	// Set sender and recipient
	if err := client.Mail(config.FromEmail); err != nil {
		return fmt.Errorf("failed to set sender: %v", err)
	}
	if err := client.Rcpt(to); err != nil {
		return fmt.Errorf("failed to set recipient: %v", err)
	}

	// Send email data
	w, err := client.Data()
	if err != nil {
		return fmt.Errorf("failed to prepare email data: %v", err)
	}
	defer w.Close()

	_, err = w.Write(message.Bytes())
	if err != nil {
		return fmt.Errorf("failed to write email data: %v", err)
	}

	return nil
}

// isValidEmail checks if the email address is valid
func isValidEmail(email string) bool {
	// Basic email validation
	if len(email) < 3 || len(email) > 254 {
		return false
	}

	// Check for @ symbol
	atIndex := -1
	for i, char := range email {
		if char == '@' {
			if atIndex != -1 {
				return false // Multiple @ symbols
			}
			atIndex = i
		}
	}

	if atIndex == -1 || atIndex == 0 || atIndex == len(email)-1 {
		return false
	}

	// Check domain
	domain := email[atIndex+1:]
	if len(domain) < 2 || !strings.Contains(domain, ".") {
		return false
	}

	return true
}
