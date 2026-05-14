import axios from 'axios';

/**
 * Fetches the package.json file from a GitHub repo.
 * @param repoUrl The full GitHub URL (e.g., https://github.com/user/repo)
 */
export const fetchRepoData = async (repoUrl: string): Promise<string> => {
  const rawPath = repoUrl.replace("github.com", "raw.githubusercontent.com") + "/main/package.json";
  
  try {
    const { data } = await axios.get(rawPath);
    return JSON.stringify(data);
  } catch (e) {
    return "Error: Could not find package.json. Ensure the branch is 'main'.";
  }
};