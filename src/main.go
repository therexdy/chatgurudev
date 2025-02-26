package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"time"
)

type Message struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type RequestData struct {
	Model    string    `json:"model"`
	Messages []Message `json:"messages"`
}

func homeHandler(w http.ResponseWriter, r *http.Request) {
	cwd, err := os.Getwd()
	if err != nil {
		http.Error(w, "Error getting current directory", http.StatusInternalServerError)
		log.Println("Error getting current directory:", err)
		return
	}
	publicDirBase := filepath.Join(cwd, "..", "public")
	fmt.Println("Serving ", publicDirBase)
	log.Println(" ", publicDirBase)
	http.FileServer(http.Dir(publicDirBase+"/home/")).ServeHTTP(w, r)
}

func apiHandler(w http.ResponseWriter, r *http.Request) {
	remoteAddr := r.RemoteAddr
	var model string
	decoder := json.NewDecoder(r.Body)
	err := decoder.Decode(&model)
	if err != nil {
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}
	var requestData RequestData
	er := decoder.Decode(&requestData)
	if er != nil {
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}
	var lastMessage Message
	if len(requestData.Messages) > 0 {
		lastMessage = requestData.Messages[len(requestData.Messages)-1]
	} else {
		fmt.Fprint(w, "No messages received.\n")
	}
	fmt.Println("Serving ", lastMessage.Content, " : ", model, " to ", remoteAddr)
	log.Println("Serving ", lastMessage.Content, " : ", model, " to ", remoteAddr)

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
	timestamp := time.Now().Format("20060102_150405")
	logFileName := "app_" + timestamp + ".log"
	logDir := "../logs/"
	logFilePath := filepath.Join(logDir, logFileName)
	if e := os.MkdirAll(logDir, os.ModePerm); e != nil {
		log.Fatal(e)
	}
	file, e := os.OpenFile(logFilePath, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
	if e != nil {
		log.Fatal(e)
	}
	defer file.Close()
	log.SetOutput(file)

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
	port := "8080"
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
