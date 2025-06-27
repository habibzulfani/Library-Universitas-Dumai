package configs

import (
	"fmt"
	"strings"
)

// EmailConfig holds the email configuration
type EmailConfig struct {
	SMTPHost       string
	SMTPPort       string
	SMTPUsername   string
	SMTPPassword   string
	FromEmail      string
	FromName       string
	AllowedDomains []string
}

// NewEmailConfig creates a new email configuration
func NewEmailConfig() *EmailConfig {
	config := &EmailConfig{
		SMTPHost:       getEnv("SMTP_HOST", "smtp.gmail.com"),
		SMTPPort:       getEnv("SMTP_PORT", "587"),
		SMTPUsername:   getEnv("SMTP_USERNAME", ""),
		SMTPPassword:   getEnv("SMTP_PASSWORD", ""),
		FromEmail:      getEnv("FROM_EMAIL", ""),
		FromName:       getEnv("FROM_NAME", "E-Repository System"),
		AllowedDomains: []string{"ac.id", "gmail.com"},
	}

	if err := config.validate(); err != nil {
		panic(fmt.Sprintf("Invalid email configuration: %v", err))
	}

	return config
}

// validate checks if the email configuration is valid
func (c *EmailConfig) validate() error {
	if c.SMTPHost == "" {
		return fmt.Errorf("SMTP host is required")
	}
	if c.SMTPPort == "" {
		return fmt.Errorf("SMTP port is required")
	}
	if c.SMTPUsername == "" {
		return fmt.Errorf("SMTP username is required")
	}
	if c.SMTPPassword == "" {
		return fmt.Errorf("SMTP password is required")
	}
	if c.FromEmail == "" {
		return fmt.Errorf("from email is required")
	}
	if c.FromName == "" {
		return fmt.Errorf("from name is required")
	}

	// Validate email format
	if !isValidEmail(c.FromEmail) {
		return fmt.Errorf("invalid from email format")
	}

	// Validate email domain
	emailParts := strings.Split(c.FromEmail, "@")
	if len(emailParts) != 2 {
		return fmt.Errorf("invalid email format")
	}

	domain := emailParts[1]
	isValidDomain := false
	for _, allowedDomain := range c.AllowedDomains {
		if strings.HasSuffix(domain, allowedDomain) {
			isValidDomain = true
			break
		}
	}

	if !isValidDomain {
		return fmt.Errorf("email domain must be one of: %v", c.AllowedDomains)
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
