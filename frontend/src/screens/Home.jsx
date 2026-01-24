import React, { useContext, useState, useEffect } from 'react';
import { UserContext } from '../context/user-context';
import axios from '../config/axios';
import { useNavigate } from 'react-router-dom';


const Home = () => {
    const { user } = useContext(UserContext)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [projectName, setProjectName] = useState('')
    const [projects, setProjects] = useState([])
    const navigate = useNavigate();



    function createProject(e) {
        e.preventDefault()
        console.log({ projectName })

        axios.post('/projects/create', {
            name: projectName,
        })
            .then((res) => {
                console.log(res)
                setProjects(prevProjects => [...prevProjects, res.data])
                setIsModalOpen(false)
            })
            .catch((error) => {
                console.log(error)
            })
    }

    useEffect(() => {
        axios.get('/projects/all').then((res) => {
            setProjects(res.data.projects);
        }).catch((error) => {
            console.error('Error fetching projects:', error);
        });
    }, [])

    return (
        <main className='p-8 min-h-screen bg-brand-black bg-glow text-white'>
            <div className="max-w-7xl mx-auto">
                <header className="flex justify-between items-center mb-12">
                    <h1 className="text-3xl font-bold tracking-tight">
                        My <span className="text-brand-pink underline decoration-brand-pink/30">Projects</span>
                    </h1>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-6 py-2.5 bg-brand-pink hover:bg-brand-pink/90 text-white font-medium rounded-full transition-all hover:scale-105 active:scale-95 glow-pink">
                        <i className="ri-add-line text-lg"></i>
                        New Project
                    </button>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {projects.map((project) => (
                        <div key={project._id}
                            onClick={() => {
                                navigate(`/project`, {
                                    state: { project }
                                })
                            }}
                            className="glass group p-6 rounded-2xl cursor-pointer transition-all hover:border-brand-pink/40 hover:bg-brand-zinc-900/60">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-brand-pink/10 rounded-xl text-brand-pink group-hover:scale-110 transition-transform">
                                    <i className="ri-terminal-box-line text-2xl"></i>
                                </div>
                                <div className="flex -space-x-2">
                                    {/* Placeholder for collaborator avatars if needed */}
                                    <div className="w-8 h-8 rounded-full bg-brand-zinc-800 border-2 border-brand-black flex items-center justify-center text-xs">
                                        <i className="ri-user-line"></i>
                                    </div>
                                </div>
                            </div>
                            <h3 className="text-xl font-semibold mb-2 group-hover:text-brand-pink transition-colors">{project.name}</h3>
                            <div className="flex items-center gap-4 text-brand-zinc-400 text-sm">
                                <span className="flex items-center gap-1">
                                    <i className="ri-group-line"></i>
                                    {project.users.length} Collaborators
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-brand-black/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
                    <div className="glass relative w-full max-w-md p-8 rounded-3xl border border-white/10 shadow-2xl">
                        <h2 className="text-2xl font-bold mb-6 text-center">Create <span className="text-brand-pink">New Project</span></h2>
                        <form onSubmit={createProject} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-brand-zinc-400 mb-2">Project Name</label>
                                <input
                                    onChange={(e) => setProjectName(e.target.value)}
                                    value={projectName}
                                    type="text"
                                    placeholder="Enter a name for your workspace..."
                                    className="w-full px-4 py-3 bg-brand-zinc-900/50 border border-brand-zinc-800 rounded-xl focus:ring-2 focus:ring-brand-pink/50 focus:border-brand-pink outline-none transition-all text-white placeholder:text-brand-zinc-600"
                                    required
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    className="flex-1 px-4 py-3 bg-brand-zinc-800 hover:bg-brand-zinc-700 text-white font-medium rounded-xl transition-colors"
                                    onClick={() => setIsModalOpen(false)}>
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-3 bg-brand-pink hover:bg-brand-pink/90 text-white font-medium rounded-xl transition-all glow-pink">
                                    Create Project
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    )
}


export default Home;