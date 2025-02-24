import React from "react";
import { useState, useEffect } from "react";
import { Upload, File, X, ExternalLink, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import axios from "axios";

export default function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState({ visible: false, message: "", type: "" });

  // Handle toast display and auto-dismiss
  const showToast = (message, type = "success") => {
    setToast({ visible: true, message, type });
    // Auto dismiss toast after 3 seconds
    setTimeout(() => {
      setToast({ visible: false, message: "", type: "" });
    }, 3000);
  };

  const handleFileChange = (event) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      // Check if file is below 100MB (100 * 1024 * 1024 bytes)
      if (file.size <= 100 * 1024 * 1024) {
        setSelectedFile(file);
        setError(null);
      } else {
        setSelectedFile(null);
        setError("File size must be below 100MB");
        showToast("File size must be below 100MB", "error");
      }
    }
  };

  const handleUpload = async () => {
    if (selectedFile && !uploading) {
      setUploading(true);
      setUploadProgress(0);
      setError(null);
      
      // Create a FormData object to send the file
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      try {
        // Use axios to upload the file with progress tracking
        const response = await axios.post('http://localhost:5000/api/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(percentCompleted);
          },
        });
        
        // Add the file to uploaded files list with its cloudinary URL
        setUploadedFiles((prevFiles) => [
          ...prevFiles,
          {
            name: selectedFile.name,
            url: response.data.secure_url
          }
        ]);
        
        setSelectedFile(null);
        showToast(`${selectedFile.name} uploaded successfully!`);
      } catch (err) {
        console.error('Upload error:', err);
        const errorMessage = `Upload failed: ${err.response?.data?.error || err.message}`;
        setError(errorMessage);
        showToast(errorMessage, "error");
        // Reset progress to 0 on error
        setUploadProgress(0);
      } finally {
        setUploading(false);
        // Remove this line: setUploadProgress(100);
      }
    }
  };

  const removeFile = (fileName) => {
    setUploadedFiles(uploadedFiles.filter((file) => file.name !== fileName));
    showToast(`${fileName} removed`);
  };

  // Handle opening file in new tab
  const openFile = (url) => {
    window.open(url, '_blank');
  };

  return (
    <div>
      <main className="min-h-screen bg-gradient-to-br from-blue-400 via-blue-200 to-white flex items-center justify-center p-4">
        <div className="bg-transparent backdrop-blur-lg rounded-xl p-8 w-full max-w-md shadow-xl">
          <h1 className="text-3xl font-bold text-black mb-6 text-center">File Uploader</h1>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <input type="file" onChange={handleFileChange} className="hidden" id="file-input" />
              <label
                htmlFor="file-input"
                className="flex-1 cursor-pointer bg-white bg-opacity-30 hover:bg-opacity-40 transition-colors duration-200 text-black rounded-lg p-3 text-center"
              >
                {selectedFile ? selectedFile.name : "Choose a file"}
              </label>
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
                className="bg-green-500 hover:bg-green-600 text-black cursor-pointer"
              >
                <Upload className="mr-2 h-4 w-4" /> Upload
              </Button>
            </div>
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded">
                {error}
              </div>
            )}
            {uploading && (
              <div className="space-y-2">
                <Progress value={uploadProgress} className="w-full" />
                <p className="text-black text-center">{uploadProgress}% Uploaded</p>
              </div>
            )}
            {uploadedFiles.length > 0 && (
              <div className="bg-white bg-opacity-30 rounded-lg p-4 mt-4">
                <h2 className="text-xl font-semibold text-black mb-2">Uploaded Files</h2>
                <ul className="space-y-2">
                  {uploadedFiles.map((file, index) => (
                    <li key={index} className="flex items-center justify-between bg-white bg-opacity-20 rounded p-2">
                      <button 
                        onClick={() => openFile(file.url)} 
                        className="flex items-center text-black hover:text-blue-700 hover:underline transition-colors cursor-pointer flex-1 text-left"
                      >
                        <File className="mr-2 h-4 w-4" /> 
                        <span className="truncate">{file.name}</span>
                        <ExternalLink className="ml-2 h-3 w-3" />
                      </button>
                      <Button
                        onClick={() => removeFile(file.name)}
                        variant="ghost"
                        size="icon"
                        className="text-white hover:text-red-500"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
        
        {/* Toast Notification */}
        {toast.visible && (
          <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg flex items-center space-x-2 text-white transition-opacity duration-300 ${
            toast.type === "error" ? "bg-red-500" : "bg-green-500"
          }`}>
            {toast.type === "error" ? (
              <AlertCircle className="h-5 w-5" />
            ) : (
              <CheckCircle className="h-5 w-5" />
            )}
            <span>{toast.message}</span>
          </div>
        )}
      </main>
    </div>
  );
}