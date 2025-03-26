// app/routes/gpu-tools.tsx

import GPUTasks from '~/components/gpu-tasks';

export default function GPUTools() {
  return (
    <div className="container">
      <h1>GPU Tools</h1>
      <p>Use these tools to execute tasks on remote GPUs without local hardware</p>
      
      <GPUTasks />
    </div>
  );
}
