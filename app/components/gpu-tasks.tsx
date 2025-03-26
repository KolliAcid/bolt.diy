// app/components/gpu-tasks.tsx
import React from 'react';

export default function GPUTasks() {
  return (
    <div className="p-4 border rounded-lg shadow-sm my-4">
      <h2 className="text-xl font-semibold mb-4">GPU Tasks</h2>
      <p className="mb-4">Use external GPU resources for processing-intensive tasks.</p>
      
      <div className="space-y-4">
        <div className="p-3 border rounded bg-gray-50">
          <h3 className="font-medium">Image Generation</h3>
          <p className="text-sm text-gray-600 mb-2">Generate images using AI models running on remote GPUs</p>
          <button className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">
            Start Image Task
          </button>
        </div>
        
        <div className="p-3 border rounded bg-gray-50">
          <h3 className="font-medium">Model Training</h3>
          <p className="text-sm text-gray-600 mb-2">Fine-tune AI models using GPU acceleration</p>
          <button className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">
            Start Training Task
          </button>
        </div>
      </div>
    </div>
  );
}
