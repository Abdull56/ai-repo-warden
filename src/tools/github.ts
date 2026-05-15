import axios from 'axios';

export const fetchRepoData = async (repoUrl: string): Promise<string> => {
  const baseUrl = repoUrl
    .replace("https://github.com", "https://raw.githubusercontent.com")
    .replace(/\/$/, ''); // strip trailing slash if any

  // Try main first, fall back to master
  const branches = ['main', 'master'];

  for (const branch of branches) {
    try {
      const { data } = await axios.get(`${baseUrl}/${branch}/package.json`);
      return JSON.stringify(data);
    } catch {
      continue; // try next branch
    }
  }

  return "Error: Could not find package.json on 'main' or 'master' branch.";
};