package utils

// StringPtr returns a pointer to the given string
func StringPtr(s string) *string {
	return &s
}

// IntPtr returns a pointer to the given int
func IntPtr(i int) *int {
	return &i
}

// UintPtr returns a pointer to the given uint
func UintPtr(u uint) *uint {
	return &u
}
