package main

import (
	"bytes"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
)

func homeHandler(w http.ResponseWriter, r *http.Request) {
	cwd, err := os.Getwd()
	if err != nil {
		http.Error(w, "Error getting current directory", http.StatusInternalServerError)
		log.Println("Error getting current directory:", err)
		return
	}
	publicDirBase := filepath.Join(cwd, "..", "public", "home")
	fmt.Println("Serving ", publicDirBase)
	http.FileServer(http.Dir(publicDirBase+"/home/")).ServeHTTP(w, r)
}

func apiHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "Error reading request body", http.StatusBadRequest)
		return
	}
	forwardURL := "http://127.0.0.1:11434/api/chat"
	forwardReq, err := http.NewRequest("POST", forwardURL, bytes.NewBuffer(body))
	if err != nil {
		http.Error(w, "Error creating forward request", http.StatusInternalServerError)
		return
	}
	forwardReq.Header = r.Header.Clone()
	client := &http.Client{}
	forwardResp, err := client.Do(forwardReq)
	if err != nil {
		http.Error(w, "Error sending forward request", http.StatusInternalServerError)
		return
	}
	defer forwardResp.Body.Close()
	forwardBody, err := io.ReadAll(forwardResp.Body)
	if err != nil {
		http.Error(w, "Error reading forward response body", http.StatusInternalServerError)
		return
	}
	for key, values := range forwardResp.Header {
		for _, value := range values {
			w.Header().Add(key, value)
		}
	}
	w.WriteHeader(forwardResp.StatusCode)
	w.Write(forwardBody)
}

func main() {
	// Declaring the Mux
	mux := http.NewServeMux()

	// Mapping request directories to handler functions
	mux.HandleFunc("/", homeHandler)
	mux.HandleFunc("/api", apiHandler)
	// .
	// .
	// .
	//mux.HandleFunc("/about", aboutHandler)

	//Port number must be changed to 80 for http and 443 for https before deploying
	port := "80"
	log.Printf("Server starting on port %s...", port)

	// Creating a server and configuring port and mux
	server := &http.Server{
		Addr:    ":" + port,
		Handler: mux,
	}

	// Starting the server
	err := server.ListenAndServe()
	if err != nil {
		log.Fatal("ListenAndServe error: ", err)
	}
}
