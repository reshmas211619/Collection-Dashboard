/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Check, Copy, ExternalLink, GitBranch, Github, AlertCircle, Loader2 } from 'lucide-react';

interface GitHubModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GitHubModal: React.FC<GitHubModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'api' | 'cli'>('api');
  const [repoInput, setRepoInput] = useState<string>('');
  const [tokenInput, setTokenInput] = useState<string>('');
  const [filePath, setFilePath] = useState<string>('PAN_India_Collection_Dashboard.html');
  const [branch, setBranch] = useState<string>('main');
  const [commitMessage, setCommitMessage] = useState<string>('Add PAN India Collection Dashboard tool');
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string; url?: string } | null>(null);
  const [copiedCli, setCopiedCli] = useState<boolean>(false);

  if (!isOpen) return null;

  // Parse owner and repo name from input
  const parseRepo = (input: string) => {
    let cleaned = input.trim();
    cleaned = cleaned.replace(/^https?:\/\/github\.com\//, '').replace(/\.git$/, '');
    const parts = cleaned.split('/');
    if (parts.length >= 2) {
      return { owner: parts[0], repo: parts[1] };
    }
    return null;
  };

  const handlePushToGitHub = async () => {
    setStatusMessage(null);
    const repoInfo = parseRepo(repoInput);
    if (!repoInfo) {
      setStatusMessage({
        type: 'error',
        text: 'Please enter a valid repository format, e.g. "username/repository-name" or full GitHub URL.'
      });
      return;
    }

    if (!tokenInput.trim()) {
      setStatusMessage({
        type: 'error',
        text: 'Please provide a GitHub Personal Access Token with "Contents: Read & Write" permission.'
      });
      return;
    }

    setIsLoading(true);

    try {
      // 1. Fetch the content of the standalone HTML file
      const htmlResponse = await fetch('/PAN_India_Collection_Dashboard.html');
      if (!htmlResponse.ok) {
        throw new Error('Failed to retrieve PAN_India_Collection_Dashboard.html from server.');
      }
      const htmlText = await htmlResponse.text();

      // Convert to UTF-8 base64
      const base64Content = btoa(unescape(encodeURIComponent(htmlText)));

      const apiUrl = `https://api.github.com/repos/${repoInfo.owner}/${repoInfo.repo}/contents/${filePath}`;

      // 2. Check if file already exists in repository to obtain SHA (required by GitHub API for updates)
      let existingSha: string | undefined;
      const getFileRes = await fetch(`${apiUrl}?ref=${branch}`, {
        headers: {
          Authorization: `Bearer ${tokenInput.trim()}`,
          Accept: 'application/vnd.github.v3+json'
        }
      });

      if (getFileRes.ok) {
        const fileData = await getFileRes.json();
        existingSha = fileData.sha;
      }

      // 3. Put file content to GitHub
      const payload: any = {
        message: commitMessage || 'Add PAN India Collection Dashboard tool',
        content: base64Content,
        branch: branch || 'main'
      };
      if (existingSha) {
        payload.sha = existingSha;
      }

      const putRes = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${tokenInput.trim()}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!putRes.ok) {
        const errJson = await putRes.json();
        throw new Error(errJson.message || `GitHub API error: ${putRes.statusText}`);
      }

      const result = await putRes.json();
      const fileWebUrl = result.content?.html_url || `https://github.com/${repoInfo.owner}/${repoInfo.repo}/blob/${branch}/${filePath}`;

      setStatusMessage({
        type: 'success',
        text: `Successfully committed ${filePath} to repository ${repoInfo.owner}/${repoInfo.repo}!`,
        url: fileWebUrl
      });
    } catch (err: any) {
      console.error('GitHub push error:', err);
      setStatusMessage({
        type: 'error',
        text: err.message || 'Failed to push file to GitHub.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const cliCode = `# 1. Add your GitHub repository remote
git remote add origin https://github.com/${repoInput.trim() || '<YOUR-USERNAME>/<YOUR-REPO>'}.git

# 2. Set default branch to main
git branch -M main

# 3. Push all files including PAN_India_Collection_Dashboard.html
git push -u origin main`;

  const copyCliCode = () => {
    navigator.clipboard.writeText(cliCode);
    setCopiedCli(true);
    setTimeout(() => setCopiedCli(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-2xl overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
              <Github className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Add to GitHub Repository
              </h3>
              <p className="text-xs text-slate-500">
                Commit and sync PAN_India_Collection_Dashboard.html to your GitHub repo
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="px-6 py-2.5 border-b border-slate-100 bg-white flex items-center gap-2 text-xs">
          <button
            onClick={() => setActiveTab('api')}
            className={`px-3 py-1.5 font-semibold rounded-lg transition-colors ${
              activeTab === 'api'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Direct Push via GitHub API
          </button>
          <button
            onClick={() => setActiveTab('cli')}
            className={`px-3 py-1.5 font-semibold rounded-lg transition-colors ${
              activeTab === 'cli'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Git CLI Commands
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs text-slate-700">
          
          {activeTab === 'api' ? (
            <div className="space-y-3.5">
              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  GitHub Repository (e.g., <code className="text-slate-600">username/my-repo</code> or URL)
                </label>
                <input
                  type="text"
                  placeholder="reshmas211619/finance-collection-dashboard"
                  value={repoInput}
                  onChange={e => setRepoInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-slate-800 focus:ring-1 focus:ring-blue-500 font-mono text-xs"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-800">
                    GitHub Personal Access Token (PAT)
                  </label>
                  <a
                    href="https://github.com/settings/tokens/new?scopes=repo&description=PAN_India_Collection_Dashboard"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-2xs text-blue-600 hover:underline flex items-center gap-0.5"
                  >
                    <span>Generate token on GitHub</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
                <input
                  type="password"
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  value={tokenInput}
                  onChange={e => setTokenInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-slate-800 focus:ring-1 focus:ring-blue-500 font-mono text-xs"
                />
                <p className="text-2xs text-slate-400 mt-1">
                  Requires <code>repo</code> or fine-grained <code>Contents: Read and write</code> scope. Tokens remain strictly in your browser and are never sent to external servers.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">Target File Path in Repo</label>
                  <input
                    type="text"
                    value={filePath}
                    onChange={e => setFilePath(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg py-1.5 px-3 text-slate-800 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">Branch Name</label>
                  <input
                    type="text"
                    value={branch}
                    onChange={e => setBranch(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg py-1.5 px-3 text-slate-800 font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">Commit Message</label>
                <input
                  type="text"
                  value={commitMessage}
                  onChange={e => setCommitMessage(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg py-1.5 px-3 text-slate-800 text-xs"
                />
              </div>

              {/* Status Banner */}
              {statusMessage && (
                <div className={`p-3 rounded-lg border text-xs ${
                  statusMessage.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}>
                  <p className="font-semibold">{statusMessage.text}</p>
                  {statusMessage.url && (
                    <a
                      href={statusMessage.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-1.5 text-emerald-900 underline font-bold"
                    >
                      <span>View File on GitHub</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              )}

              <button
                onClick={handlePushToGitHub}
                disabled={isLoading}
                className="w-full py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Pushing to GitHub...</span>
                  </>
                ) : (
                  <>
                    <Github className="w-4 h-4" />
                    <span>Push PAN_India_Collection_Dashboard.html to Repo</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-slate-600">
                The local Git repository has already been initialized and committed in this workspace. Run the following commands to link and push it to your GitHub repository:
              </p>

              <div className="relative bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-2xs overflow-x-auto leading-relaxed">
                <pre>{cliCode}</pre>
                <button
                  onClick={copyCliCode}
                  className="absolute top-2 right-2 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-2xs flex items-center gap-1 border border-slate-700"
                >
                  {copiedCli ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-300" />}
                  <span>{copiedCli ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-1.5 text-blue-900">
                <span className="font-bold flex items-center gap-1">
                  <GitBranch className="w-3.5 h-3.5" />
                  <span>Deploying as a Free Web App with GitHub Pages</span>
                </span>
                <p className="text-slate-700 text-2xs">
                  Once pushed to GitHub, go to <strong>Settings &gt; Pages</strong> in your repository, set the branch to <code>main</code>, and choose root <code>/</code>. Your PAN India Collection Dashboard will immediately be live at <code>https://&lt;username&gt;.github.io/&lt;repo&gt;/PAN_India_Collection_Dashboard.html</code>!
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
