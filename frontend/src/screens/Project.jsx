import React,{useState, useEffect, useContext, useRef} from 'react';
import { useLocation } from 'react-router-dom';
import axios from '../config/axios';
import { initializeSocket, receiveMessage, sendMessage } from '../config/socket';
import { UserContext } from '../context/user-context';
import Markdown from 'markdown-to-jsx'; 
import hljs from 'highlight.js';



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
    const messageBox = useRef(); // Reference to the message box

    function SyntaxHighlightedCode(props) {
        const ref = useRef(null)

        React.useEffect(() => {
            if (ref.current && props.className?.includes('lang-') && window.hljs) {
                window.hljs.highlightElement(ref.current)

                // hljs won't reprocess the element unless this attribute is removed
                ref.current.removeAttribute('data-highlighted')
            }
        }, [ props.className, props.children ])

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
            console.log("Updated SelectedUserId:", Array.from(newSelectedUserId)); // Debugging log

            return newSelectedUserId;
        });


    }

    function addCollaborators() {

        axios.put("/projects/add-user", {
            projectId: location.state.project._id,
            users: Array.from(selectedUserId)
        }).then(res => {
            console.log(res.data)
            setIsModalOpen(false)

        }).catch(err => {
            console.log(err)
        })

    }

    function send(){
        sendMessage('project-message', {
            message,
            sender: user
        });

        setMessages(prevMessages => [ ...prevMessages, { sender: user, message } ]) // Update messages state

        setMessage(''); // Clear the message input after sending
    }



    function scrollToBottom() {
        if (messageBox.current) {
            messageBox.current.scrollTop = messageBox.current.scrollHeight;
        }
    }

    useEffect(() => {

        initializeSocket(project._id) // Initialize the socket connection

        receiveMessage('project-message', data => {
            setMessages(prevMessages => [ ...prevMessages, data]) // Update messages state
        });

        axios.get(`/projects/get-project/${location.state.project._id}`).then((res) => {
            console.log(res.data.project);
            setProject(res.data.project);
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
        <main
            className='w-screen h-screen flex'
        >
            <section className="left relative h-screen min-w-96 bg-slate-300 flex flex-col bg-slate-300">
                <header className='p-2 px-4 bg-slate-100 flex justify-between items-center w-full absolute top-0'>
                    <button onClick={() => setIsModalOpen(true)} className='flex gap-1'>
                        <i className="ri-add-fill"></i>
                        <p>Add Collaborator</p>
                    </button>


                    <button onClick={() => setIsSidePanelOpen(!isSidePanelOpen)} className='p-2'>
                        <i className="ri-group-fill"></i>
                    </button>
                </header>

                <div className="conversation-area pt-14 pb-10 flex-grow flex flex-col h-full relative">
                    <div
                        ref = {messageBox}
                        className="message-box p-1 flex-grow flex flex-col gap-2 overflow-auto scrollbar-hide max-h-full">
                        {messages.map((msg, index) => (
                            <div key={index} className={`${msg.sender._id === 'ai' ? 'max-w-80' : 'max-w-54'} ${msg.sender._id == user._id.toString() && 'ml-auto'} message flex flex-col p-2 bg-slate-50 w-fit rounded-md`}>
                                <small className='opacity-65 text-xs'>{msg.sender.email}</small>
                                <div className='text-sm'>
                                    {msg.sender._id === 'ai' ? 
                                    <div className='overflow-auto bg-slate-950 text-white rounded-sm p-2'>
                                        <Markdown
                                            children={msg.message}
                                            options = {{
                                                overrides: {
                                                    code: SyntaxHighlightedCode,
                                                },
                                            }}
                                        />
                                    </div>
                                    : msg.message}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="input-field w-full flex absolute bottom-0">
                        <input
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    send();
                                }
                            }}
                            type="text" placeholder='Type a message...' className='p-2 px-4 border-none outline-none border-slate-300 flex-grow'/>
                        <button onClick={send} className='px-5 text-white bg-slate-900'>
                            <i className="ri-send-plane-fill"></i>
                        </button>
                    </div>
                </div>

                <div className={`sidePanel w-full h-full flex flex-col gap-2 bg-slate-50 absolute top-0 transition-all ${isSidePanelOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                    <header className='p-2 px-4 bg-slate-200 flex justify-between items-center'>

                        <h1 className='font-semibold text-lg'>Collaborators</h1>

                        <button onClick={() => setIsSidePanelOpen(false)} className='p-2'>
                            <i className="ri-close-fill"></i>
                        </button>
                    </header>

                    <div className="users flex flex-col gap-2">
                        {project.users && project.users.map(user => {
                            const userObj = typeof user === 'object' ? user : { _id: user, email: user };

                            return (
                                <div key={userObj._id} className="user cursor-pointer hover:bg-slate-200 p-2 flex gap-2 items-center">
                                    <div className='aspect-square rounded-full w-fit h-fit flex items-center justify-center p-5 text-white bg-slate-600'>
                                        <i className="ri-user-fill absolute"></i>
                                    </div>
                                    <h1 className='font-semibold text-lg'>{user.email}</h1>
                                </div>
                            )


                        })}
                    </div>
                </div>

            </section>  

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white p-4 rounded-md w-96 max-w-full relative">
                        <header className='flex justify-between items-center mb-4'>
                            <h2 className='text-xl font-semibold'>Select User</h2>
                            <button onClick={() => setIsModalOpen(false)} className='p-2'>
                                <i className="ri-close-fill"></i>
                            </button>
                        </header>
                        <div className="users-list flex flex-col gap-2 mb-16 max-h-96 overflow-auto">
                            {users.map(user => (
                                <div key={user._id} className={`user cursor-pointer hover:bg-slate-200 ${Array.from(selectedUserId).indexOf(user._id) != -1 ? 'bg-slate-200' : ""} p-2 flex gap-2 items-center`} onClick={() => handleUserClick(user._id)}>
                                    <div className='aspect-square relative rounded-full w-fit h-fit flex items-center justify-center p-5 text-white bg-slate-600'>
                                        <i className="ri-user-fill absolute"></i>
                                    </div>
                                    <h1 className='font-semibold text-lg'>{user.email}</h1>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={addCollaborators}
                            className='absolute bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-blue-600 text-white rounded-md'>
                            Add Collaborators
                        </button>
                    </div>
                </div>
            )}

        </main>
    );
}
 
export default Project;