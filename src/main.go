package main

import (
	"log"
	"net/http"
)

const publicDirBase string = "/home/rexdy/pf/expt/goserve/public"

func homeHandler(w http.ResponseWriter, r *http.Request) {
	http.FileServer(http.Dir(publicDirBase+"/home/")).ServeHTTP(w, r)
}

func main() {
	// Declaring the Mux
	mux := http.NewServeMux()

	// Mapping request directories to handler functions
	mux.HandleFunc("/", homeHandler)
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
