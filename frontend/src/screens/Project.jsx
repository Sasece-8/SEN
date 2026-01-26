import React, { useState, useEffect, useContext, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import axios from '../config/axios';
import { initializeSocket, receiveMessage, sendMessage } from '../config/socket';
import { UserContext } from '../context/user-context';
import Markdown from 'markdown-to-jsx';
import hljs from 'highlight.js';
import { getWebContainer } from '../config/webContainer';



const Project = () => {
    const location = useLocation();
    // console.log(location.state);

    const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);  // Used for toggling side panel
    const [isModalOpen, setIsModalOpen] = useState(false);          // Used for showing/hiding modal
    const [users, setUsers] = useState([]);                         // List of all users for the modal
    const [selectedUserId, setSelectedUserId] = useState(new Set()); // Set to keep track of selected user IDs
    const [project, setProject] = useState(location.state.project);  // Current project state
    const [message, setMessage] = useState(''); // Message in the project
    const { user } = useContext(UserContext); // Current user context
    const [messages, setMessages] = useState([]);
    const [fileTree, setFileTree] = useState({});
    const [currentFile, setCurrentFile] = useState(null);
    const [openFiles, setOpenFiles] = useState([])
    const messageBox = useRef(); // Reference to the message box
    const [webContainer, setwebContainer] = useState(null);
    const [IframeUrl, setIframeUrl] = useState(null);
    const [runProcess, setRunProcess] = useState(null);
    const [isRunning, setIsRunning] = useState(false);
    const [isPreviewFullScreen, setIsPreviewFullScreen] = useState(false);


    function SyntaxHighlightedCode(props) {
        const ref = useRef(null)

        React.useEffect(() => {
            if (ref.current && props.className?.includes('lang-') && window.hljs) {
                window.hljs.highlightElement(ref.current)

                // hljs won't reprocess the element unless this attribute is removed
                ref.current.removeAttribute('data-highlighted')
            }
        }, [props.className, props.children])

        return <code {...props} ref={ref} />
    }

    const handleUserClick = (id) => {
        setSelectedUserId(prevSelectedUserId => {
            const newSelectedUserId = new Set(prevSelectedUserId);
            if (newSelectedUserId.has(id)) {
                newSelectedUserId.delete(id);
            } else {
                newSelectedUserId.add(id);
            }
            // console.log("Updated SelectedUserId:", Array.from(newSelectedUserId)); // Debugging log

            return newSelectedUserId;
        });


    }

    function addCollaborators() {

        axios.put("/projects/add-user", {
            projectId: location.state.project._id,
            users: Array.from(selectedUserId)
        }).then(res => {
            console.log(res.data)
            setProject(res.data.project)
            setIsModalOpen(false)

        }).catch(err => {
            console.log(err)
        })

    }

    function send() {
        sendMessage('project-message', {
            message,
            sender: user
        });

        setMessages(prevMessages => [...prevMessages, { sender: user, message }]) // Update messages state

        setMessage(''); // Clear the message input after sending
    }

    function WriteAiMessage(message) {
        let messageObject;

        try {
            // Try to parse as JSON first
            messageObject = JSON.parse(message);
        } catch (error) {
            console.warn('Failed to parse message as JSON:', error);
            // If parsing fails, treat the message as plain text
            messageObject = { text: message };
        }

        return (
            <div className='overflow-auto bg-brand-zinc-950 text-white rounded-xl p-3 border border-white/5'>
                <Markdown
                    children={messageObject.text}
                    options={{
                        overrides: {
                            code: SyntaxHighlightedCode,
                        },
                    }}
                />
            </div>
        );
    }

    function saveFileTree(ft) {
        axios.put('/projects/update-file-tree', {
            projectId: project._id,
            fileTree: ft
        }).then(res => {
            console.log('File tree saved successfully:', res.data);
        }).catch(err => {
            console.error('Error saving file tree:', err);
        });
    }


    function scrollToBottom() {
        if (messageBox.current) {
            messageBox.current.scrollTop = messageBox.current.scrollHeight;
        }
    }

    useEffect(() => {

        initializeSocket(project._id) // Initialize the socket connection

        if (!webContainer) {
            getWebContainer().then(container => {
                setwebContainer(container);
                console.log("container started");
                setwebContainer(container);
                console.log("container started");

                // Add server-ready listener once when container starts
                container.on("server-ready", (port, url) => {
                    console.log(`Server ready at port ${port}: ${url}`);
                    // Only automatically display the frontend (Vite default port or common React ports)
                    if (port === 5173 || port === 3000 || port === 8080) {
                        setIframeUrl(url);
                        setIsRunning(false); // Stop the spinner when frontend is ready
                    }
                });
            });
        }

        receiveMessage('project-message', async data => {

            if (data.isError) {
                alert(data.message);
                return;
            }

            //Robust JSON extraction to handle potential trailing characters
            try {
                let messageData = data.message;
                let parsedMessage = null;

                try {
                    // Try direct parse first
                    parsedMessage = JSON.parse(messageData);
                } catch (e) {
                    // If direct parse fails, try to extract the first valid JSON object
                    const jsonStart = messageData.indexOf('{');
                    const jsonEnd = messageData.lastIndexOf('}');
                    if (jsonStart !== -1 && jsonEnd !== -1) {
                        const jsonString = messageData.substring(jsonStart, jsonEnd + 1);
                        parsedMessage = JSON.parse(jsonString);
                    } else {
                        throw new Error('No valid JSON found in message');
                    }
                }

                if (parsedMessage && parsedMessage.fileTree) {
                    setFileTree(parsedMessage.fileTree);
                    await webContainer?.mount(parsedMessage.fileTree);
                    saveFileTree(parsedMessage.fileTree); // Save the new file tree to the backend immediately
                }
            } catch (err) {
                console.log("Could not parse fileTree from message:", err.message);
            }
            // --- CORRECTION END ---

            setMessages(prevMessages => [...prevMessages, data]); // Update messages state
        });

        axios.get(`/projects/get-project/${location.state.project._id}`).then((res) => {
            console.log(res.data.project);
            setProject(res.data.project);
            setFileTree(
                typeof res.data.project.fileTree === "object" && res.data.project.fileTree !== null
                    ? res.data.project.fileTree
                    : {}
            );

        }).catch((error) => {
            console.error('Error fetching project:', error);
        });

        axios.get('/users/all').then((res) => {
            setUsers(res.data.users);
        }).catch((error) => {
            console.error('Error fetching users:', error);
        });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);


    // function appendIncomingMessage(messageObject) {

    //     const message = document.createElement('div');
    //     message.className = 'message break-words overflow-wrap w-fit max-w-56 flex flex-col p-2 w-fit bg-slate-50 rounded-md';
    //     message.innerHTML = `
    //         <small class='opacity-65 text-xs'>${messageObject.sender.email}</small>
    //         <p class='text-sm'>${messageObject.message}</p>
    //     `;
    //     messageBox.current.appendChild(message);
    //     scrollToBottom();

    // }

    // function appendOutgoingMessage(message) {
    //     if (!messageBox.current) return;

    //     const newMessage = document.createElement('div');
    //     newMessage.className = 'message w-fit max-w-56 flex flex-col p-2 w-fit bg-slate-50 rounded-md ml-auto';
    //     newMessage.innerHTML = `
    //         <small class='opacity-65 text-xs'>${user.email}</small>
    //         <p class='text-sm'>${message}</p>
    //     `;
    //     messageBox.current.appendChild(newMessage);
    //     scrollToBottom();
    // }


    return (
        <main className='w-screen h-screen flex bg-brand-black text-white font-poppins overflow-hidden'>
            <section className="left relative h-screen w-96 flex flex-col border-r border-white/10 glass flex-shrink-0">
                <header className='p-4 bg-brand-zinc-950/50 backdrop-blur-md flex justify-between items-center w-full absolute top-0 z-10 border-bottom border-white/5'>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className='flex items-center gap-2 px-4 py-2 bg-brand-pink/10 hover:bg-brand-pink/20 text-brand-pink rounded-full transition-all text-sm font-medium'>
                        <i className="ri-add-fill text-lg"></i>
                        Add Collaborator
                    </button>

                    <button
                        onClick={() => setIsSidePanelOpen(!isSidePanelOpen)}
                        className='p-2 hover:bg-white/5 rounded-full transition-colors'>
                        <i className="ri-group-fill text-lg"></i>
                    </button>
                </header>

                <div className="conversation-area pt-20 pb-12 flex-grow flex flex-col h-full relative overflow-hidden">
                    <div
                        ref={messageBox}
                        className="message-box p-4 flex-grow flex flex-col gap-4 overflow-auto scrollbar-hide">
                        {messages.map((msg, index) => (
                            <div key={index} className={`${msg.sender._id === 'ai' ? 'max-w-[85%]' : 'max-w-[85%]'} ${msg.sender._id == user._id.toString() && 'ml-auto'} message flex flex-col gap-1 w-fit`}>
                                <small className='opacity-40 text-[10px] uppercase tracking-wider ml-1'>{msg.sender.email === user.email ? 'You' : msg.sender.email}</small>
                                <div className={`p-3 rounded-2xl text-sm break-words overflow-hidden ${msg.sender._id == user._id.toString() ? 'bg-brand-pink text-white rounded-tr-none' : 'bg-brand-zinc-900 border border-white/5 rounded-tl-none'}`}>
                                    {msg.sender._id === 'ai' ?
                                        WriteAiMessage(msg.message)
                                        : <p className="leading-relaxed break-all">{msg.message}</p>
                                    }
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="input-field w-full flex p-4 absolute bottom-0 bg-brand-zinc-950/50 backdrop-blur-md border-t border-white/5">
                        <input
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    send();
                                }
                            }}
                            type="text"
                            placeholder='Type a message...'
                            className='bg-brand-zinc-900 border border-brand-zinc-800 rounded-full px-6 py-3 outline-none focus:border-brand-pink/50 focus:ring-1 focus:ring-brand-pink/50 transition-all flex-grow text-white placeholder:text-brand-zinc-500' />
                        <button
                            onClick={send}
                            className='ml-2 w-12 h-12 flex items-center justify-center bg-brand-pink hover:bg-brand-pink/90 text-white rounded-full transition-all active:scale-90 glow-pink'>
                            <i className="ri-send-plane-2-fill text-xl"></i>
                        </button>
                    </div>
                </div>

                <div className={`sidePanel w-full h-full flex flex-col bg-brand-zinc-950 z-20 absolute top-0 transition-all duration-300 ease-in-out ${isSidePanelOpen ? 'translate-x-0' : '-translate-x-full'} border-r border-white/10 shadow-2xl`}>
                    <header className='p-5 bg-brand-zinc-900 flex justify-between items-center border-b border-white/5'>
                        <h1 className='font-bold text-xl'>Collaborators</h1>
                        <button onClick={() => setIsSidePanelOpen(false)} className='p-2 hover:bg-white/5 rounded-full transition-colors'>
                            <i className="ri-close-fill text-2xl"></i>
                        </button>
                    </header>

                    <div className="users p-2 flex flex-col gap-1 overflow-auto">
                        {project.users && project.users.map(user => {
                            const userObj = typeof user === 'object' ? user : { _id: user, email: user };

                            return (
                                <div key={userObj._id} className="user cursor-pointer hover:bg-white/5 p-3 rounded-xl flex gap-3 items-center transition-colors">
                                    <div className='w-10 h-10 rounded-full flex items-center justify-center bg-brand-zinc-800 border border-white/10 text-brand-pink'>
                                        <i className="ri-user-smile-line text-lg"></i>
                                    </div>
                                    <h1 className='font-medium text-brand-zinc-100 truncate'>{userObj.email}</h1>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </section>

            <section className='right flex-grow h-full flex overflow-hidden'>
                <div className={`explorer h-full bg-brand-zinc-950 border-r border-white/5 min-w-[200px] max-w-[300px] flex flex-col ${isPreviewFullScreen ? 'hidden' : ''}`}>
                    <header className="p-4 border-b border-white/5 flex items-center justify-between">
                        <h2 className="text-xs uppercase tracking-widest font-bold text-brand-zinc-500">Explorer</h2>
                    </header>
                    <div className="fileTree w-full overflow-auto p-2">
                        {
                            Object.keys(fileTree).map((file, index) => {
                                const renderTree = (fileName, fileData, path = "") => {
                                    const fullPath = path ? `${path}/${fileName}` : fileName;

                                    if (fileData && fileData.file) {
                                        // Is a file
                                        return (
                                            <button
                                                key={fullPath}
                                                onClick={() => {
                                                    setCurrentFile(fullPath)
                                                    setOpenFiles([...new Set([...openFiles, fullPath])])
                                                }}
                                                className={`group flex items-center gap-3 w-full p-2.5 rounded-lg transition-all text-sm mb-1 ${currentFile === fullPath ? 'bg-brand-pink/10 text-brand-pink' : 'text-brand-zinc-400 hover:bg-white/5 hover:text-white'}`}>
                                                <i className={`ri-file-code-line text-lg ${currentFile === fullPath ? 'text-brand-pink' : 'text-brand-zinc-500 group-hover:text-brand-zinc-300'}`}></i>
                                                <span className="font-medium truncate">{fileName}</span>
                                            </button>
                                        )
                                    } else if (fileData && fileData.directory) {
                                        // Is a directory
                                        return (
                                            <div key={fullPath} className="w-full">
                                                <div className="flex items-center gap-3 w-full p-2.5 text-brand-zinc-300">
                                                    <i className="ri-folder-fill text-lg text-brand-zinc-500"></i>
                                                    <span className="font-medium truncate">{fileName}</span>
                                                </div>
                                                <div className="pl-4 border-l border-white/5 ml-4">
                                                    {Object.keys(fileData.directory).map((childFile) => (
                                                        renderTree(childFile, fileData.directory[childFile], fullPath)
                                                    ))}
                                                </div>
                                            </div>
                                        )
                                    }
                                    return null;
                                };

                                return renderTree(file, fileTree[file]);
                            })
                        }
                    </div>
                </div>

                <div className={`code-editor flex flex-col flex-grow h-full bg-brand-zinc-900/50 ${isPreviewFullScreen ? 'hidden' : ''}`}>
                    <div className="top flex justify-between items-center bg-brand-zinc-950/80 border-b border-white/5 pr-4">
                        <div className="files flex overflow-auto scrollbar-hide">
                            {openFiles.map((file, index) => (
                                <div key={index} className="flex items-center group">
                                    <button
                                        onClick={() => setCurrentFile(file)}
                                        className={`relative p-3 px-5 flex items-center gap-2 transition-all ${currentFile === file ? 'text-brand-pink bg-brand-zinc-900 font-semibold' : 'text-brand-zinc-500 hover:bg-white/5 hover:text-brand-zinc-300'}`}>
                                        <span className="text-sm">{file.split('/').pop()}</span>
                                        {currentFile === file && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-pink"></div>}
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const newFiles = openFiles.filter(f => f !== file);
                                            setOpenFiles(newFiles);
                                            if (currentFile === file) setCurrentFile(newFiles[newFiles.length - 1] || null);
                                        }}
                                        className="p-1 text-brand-zinc-600 hover:text-white rounded transition-colors mr-2">
                                        <i className="ri-close-line"></i>
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className="actions flex gap-2 py-2">
                            <button
                                onClick={async () => {
                                    if (!webContainer) return;
                                    setIsRunning(true);
                                    setIframeUrl(null); // Reset iframe URL
                                    await webContainer.mount(fileTree)

                                    const installProcess = await webContainer.spawn("npm", ["install"]);

                                    installProcess.output.pipeTo(new WritableStream({
                                        write(chunk) { console.log(chunk); }
                                    }));

                                    const exitCode = await installProcess.exit;

                                    if (exitCode !== 0) {
                                        console.error('npm install failed with exit code', exitCode);
                                        setIsRunning(false);
                                        return;
                                    }

                                    if (runProcess) runProcess.kill();

                                    // Determine the start command
                                    let startCommand = ["start"];
                                    try {
                                        const packageJsonContent = fileTree['package.json']?.file?.contents || '{}';
                                        const packageJson = JSON.parse(packageJsonContent);
                                        console.log("Parsed package.json:", packageJson); // DEBUG LOG
                                        if (packageJson.scripts && packageJson.scripts.dev) {
                                            startCommand = ["run", "dev"];
                                        }
                                    } catch (e) {
                                        console.warn("Failed to parse package.json for start command", e);
                                    }

                                    console.log("Selected Start Command:", startCommand); // DEBUG LOG

                                    let tempRunProcess = await webContainer.spawn("npm", startCommand);

                                    tempRunProcess.output.pipeTo(new WritableStream({
                                        write(chunk) { console.log(chunk); }
                                    }));

                                    setRunProcess(tempRunProcess);

                                    // Server-ready listener is now handled in the useEffect hook to prevent duplicates
                                }}
                                disabled={isRunning || !webContainer}
                                className={`flex items-center gap-2 px-6 py-1.5 text-white font-bold rounded-lg transition-all active:scale-95 ${(isRunning || !webContainer) ? 'bg-brand-zinc-700 cursor-not-allowed' : 'bg-brand-pink hover:bg-brand-pink/90 glow-pink'}`}
                            >
                                {isRunning ? (
                                    <i className="ri-loader-4-line animate-spin text-lg"></i>
                                ) : !webContainer ? (
                                    <i className="ri-loader-2-line animate-spin text-lg"></i>
                                ) : (
                                    <i className="ri-play-fill text-lg"></i>
                                )}
                                {isRunning ? 'Running...' : !webContainer ? 'Booting...' : 'Run'}
                            </button>
                        </div>
                    </div>
                    <div className="bottom flex flex-grow relative overflow-hidden">
                        {currentFile && (
                            <div className="code-editor-area h-full overflow-auto flex-grow bg-brand-black/20">
                                <pre className="h-full">
                                    <code
                                        className="outline-none block p-8 text-sm leading-loose tracking-wide h-full"
                                        contentEditable
                                        suppressContentEditableWarning
                                        onBlur={(e) => {
                                            if (!currentFile) return;
                                            const updatedContent = e.target.textContent;

                                            // Handle deep updates helper
                                            const updateFileTree = (tree, pathParts, content) => {
                                                const part = pathParts[0];
                                                if (pathParts.length === 1) {
                                                    return {
                                                        ...tree,
                                                        [part]: { ...tree[part], file: { ...tree[part].file, contents: content } }
                                                    };
                                                }
                                                return {
                                                    ...tree,
                                                    [part]: {
                                                        ...tree[part],
                                                        directory: updateFileTree(tree[part].directory, pathParts.slice(1), content)
                                                    }
                                                };
                                            };

                                            const ft = updateFileTree(fileTree, currentFile.split('/'), updatedContent);
                                            setFileTree(ft)
                                            saveFileTree(ft)
                                        }}
                                        dangerouslySetInnerHTML={{
                                            __html: (() => {
                                                const getFileContent = (tree, pathParts) => {
                                                    const part = pathParts[0];
                                                    if (pathParts.length === 1) return tree[part]?.file?.contents || '';
                                                    return getFileContent(tree[part]?.directory, pathParts.slice(1));
                                                };
                                                const content = getFileContent(fileTree, currentFile.split('/'));
                                                return hljs.highlight('javascript', content).value;
                                            })()
                                        }}
                                        style={{
                                            whiteSpace: 'pre-wrap',
                                            paddingBottom: '25rem',
                                            minHeight: '100%',
                                            fontFamily: 'JetBrains Mono, Fira Code, monospace',
                                        }}
                                    />
                                </pre>
                            </div>
                        )}
                        {!currentFile && (
                            <div className="flex-grow flex flex-col items-center justify-center text-brand-zinc-600">
                                <i className="ri-code-s-slash-line text-8xl mb-4 opacity-20"></i>
                                <p className="text-lg font-medium">Select a file to start coding</p>
                            </div>
                        )}
                    </div>
                </div>

                {IframeUrl && webContainer && (
                    <div className="flex min-w-[400px] flex-grow flex-col h-full bg-brand-zinc-950 border-l border-white/10 glass">
                        <header className="p-3 border-b border-white/5 flex items-center gap-3">
                            <div className="flex gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-red-500/50"></div>
                                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50"></div>
                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50"></div>
                            </div>
                            <div className="flex-grow">
                                <input
                                    type="text"
                                    onChange={(e) => setIframeUrl(e.target.value)}
                                    value={IframeUrl}
                                    className="w-full px-4 py-1.5 bg-brand-zinc-900 border border-brand-zinc-800 rounded-full text-xs text-brand-zinc-400 outline-none focus:border-brand-pink/30 transition-all font-mono"
                                />
                            </div>
                            <button onClick={() => setIsPreviewFullScreen(!isPreviewFullScreen)} className="p-1 hover:bg-white/5 rounded text-brand-zinc-500 transition-colors">
                                <i className={isPreviewFullScreen ? "ri-fullscreen-exit-fill" : "ri-fullscreen-fill"}></i>
                            </button>
                            <button onClick={() => window.open(IframeUrl, '_blank')} className="p-1 hover:bg-white/5 rounded text-brand-zinc-500 transition-colors">
                                <i className="ri-external-link-fill"></i>
                            </button>
                            <button onClick={() => {
                                setIframeUrl(null);
                                setIsPreviewFullScreen(false);
                            }} className="p-1 hover:bg-white/5 rounded text-brand-zinc-500 transition-colors">
                                <i className="ri-close-fill"></i>
                            </button>
                        </header>
                        <iframe src={IframeUrl} className="w-full h-full bg-white"></iframe>
                    </div>
                )}
            </section>

            {
                isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-brand-black/90 backdrop-blur-md" onClick={() => setIsModalOpen(false)}></div>
                        <div className="glass relative w-full max-w-lg p-10 rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
                            <div className="absolute top-0 right-0 p-6">
                                <button onClick={() => setIsModalOpen(false)} className="text-brand-zinc-500 hover:text-white transition-colors">
                                    <i className="ri-close-fill text-3xl"></i>
                                </button>
                            </div>
                            <h2 className='text-3xl font-extrabold mb-8 text-center'>Select <span className="text-brand-pink">Users</span></h2>
                            <div className="users-list flex flex-col gap-2 mb-10 max-h-80 overflow-auto scrollbar-hide">
                                {users.map(user => (
                                    <div
                                        key={user._id}
                                        className={`user cursor-pointer group flex items-center gap-4 p-4 rounded-2xl transition-all border ${selectedUserId.has(user._id) ? 'bg-brand-pink/10 border-brand-pink/50 text-brand-pink' : 'border-white/5 hover:bg-white/5'}`}
                                        onClick={() => handleUserClick(user._id)}>
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${selectedUserId.has(user._id) ? 'bg-brand-pink text-white' : 'bg-brand-zinc-800 text-brand-zinc-400 group-hover:bg-brand-zinc-700'}`}>
                                            <i className="ri-user-heart-line text-xl"></i>
                                        </div>
                                        <h1 className='font-bold text-lg flex-grow'>{user.email}</h1>
                                        {selectedUserId.has(user._id) && <i className="ri-checkbox-circle-fill text-2xl"></i>}
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-center">
                                <button
                                    onClick={addCollaborators}
                                    className='px-12 py-4 bg-brand-pink hover:bg-brand-pink/90 text-white font-black rounded-xl transition-all hover:scale-105 active:scale-95 glow-pink'>
                                    SAVE COLLABORATORS
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

        </main >
    );
}

export default Project;

