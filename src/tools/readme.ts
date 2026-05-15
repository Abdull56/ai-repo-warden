import axios from 'axios';

export const fetchReadme = async (repoUrl: string): Promise<string> => {
  const baseUrl = repoUrl
    .replace("https://github.com", "https://raw.githubusercontent.com")
    .replace(/\/$/, '');

  const branches = ['main', 'master'];

  for (const branch of branches) {
    try {
      const { data } = await axios.get(`${baseUrl}/${branch}/README.md`);
      return data.substring(0, 2000);
    } catch {
      continue;
    }
  }

  return "Error: README.md not found on 'main' or 'master' branch.";
};