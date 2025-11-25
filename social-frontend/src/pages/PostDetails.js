import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, addDoc, query, orderBy, onSnapshot, updateDoc, increment, arrayUnion, arrayRemove, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import './PostDetails.css';
import '../pages/Home.css'; // Reuse some styles

const PostDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [post, setPost] = useState(null);
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newComment, setNewComment] = useState('');
    const [commentImage, setCommentImage] = useState(null);
    const fileInputRef = useRef(null);

    // Fetch Post
    useEffect(() => {
        const fetchPost = async () => {
            try {
                const docRef = doc(db, 'posts', id);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setPost({ id: docSnap.id, ...docSnap.data() });
                } else {
                    console.log("No such document!");
                }
            } catch (error) {
                console.error("Error fetching post:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchPost();
    }, [id]);

    // Listen for Comments
    useEffect(() => {
        const commentsRef = collection(db, 'posts', id, 'comments');
        const q = query(commentsRef, orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const commentsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setComments(commentsData);
        });

        return () => unsubscribe();
    }, [id]);

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setCommentImage(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmitComment = async (e) => {
        e.preventDefault();
        if (!currentUser) {
            alert("Devi essere loggato per commentare.");
            return;
        }
        if (!newComment.trim() && !commentImage) return;

        try {
            const commentsRef = collection(db, 'posts', id, 'comments');
            await addDoc(commentsRef, {
                text: newComment,
                imageUrl: commentImage,
                author: currentUser.displayName || currentUser.email.split('@')[0],
                authorId: currentUser.uid,
                authorPic: currentUser.photoURL || "https://cdn-icons-png.flaticon.com/512/847/847969.png",
                createdAt: serverTimestamp(),
                coffees: 0,
                coffeeBy: []
            });

            // Update comment count on post
            const postRef = doc(db, 'posts', id);
            await updateDoc(postRef, {
                comments: increment(1)
            });

            setNewComment('');
            setCommentImage(null);
        } catch (error) {
            console.error("Error adding comment:", error);
        }
    };

    const handleCoffeeVote = async (commentId, currentCoffees, coffeeBy) => {
        if (!currentUser) {
            alert("Devi essere loggato per votare.");
            return;
        }

        const hasVoted = coffeeBy?.includes(currentUser.uid);
        const commentRef = doc(db, 'posts', id, 'comments', commentId);

        try {
            if (hasVoted) {
                await updateDoc(commentRef, {
                    coffees: increment(-1),
                    coffeeBy: arrayRemove(currentUser.uid)
                });
            } else {
                await updateDoc(commentRef, {
                    coffees: increment(1),
                    coffeeBy: arrayUnion(currentUser.uid)
                });
            }
        } catch (error) {
            console.error("Error toggling coffee:", error);
        }
    };

    if (loading) return <div className="loading">Caricamento...</div>;
    if (!post) return <div className="error">Post non trovato.</div>;

    return (
        <div className="home-layout">
            <div className="post-details-container">
                <button className="back-button" onClick={() => navigate('/')}>
                    ← Torna alla Home
                </button>

                {/* Post Card (Simplified version of Home card) */}
                <div className="post-details-card">
                    <div className="post-header">
                        <span className="post-author">{post.author}</span>
                        {/* <span className="post-time">• {new Date(post.createdAt?.toDate()).toLocaleDateString()}</span> */}
                    </div>
                    <div className="post-content">
                        <h1 className="post-title">{post.title}</h1>
                        <p className="post-text">{post.content}</p>
                        {post.imageUrl && (
                            <img src={post.imageUrl} alt={post.title} className="post-image" />
                        )}
                    </div>
                    <div className="post-footer">
                        <div className="vote-actions">
                            <span className="vote-count">{post.votes} Voti</span>
                        </div>
                        <div className="social-actions">
                            <span className="action-btn">💬 {comments.length} Commenti</span>
                        </div>
                    </div>
                </div>

                {/* Add Comment */}
                <div className="add-comment-form">
                    <textarea
                        className="comment-input"
                        placeholder="Scrivi un commento..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                    />
                    {commentImage && (
                        <div className="preview-image-container">
                            <img src={commentImage} alt="Preview" className="preview-image" />
                            <button className="remove-image-btn" onClick={() => setCommentImage(null)}>×</button>
                        </div>
                    )}
                    <div className="form-actions">
                        <button className="image-upload-btn" onClick={() => fileInputRef.current.click()}>
                            📷 Aggiungi Immagine
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageUpload}
                            style={{ display: 'none' }}
                            accept="image/*"
                        />
                        <button
                            className="submit-comment-btn"
                            onClick={handleSubmitComment}
                            disabled={!newComment.trim() && !commentImage}
                        >
                            Pubblica
                        </button>
                    </div>
                </div>

                {/* Comments List */}
                <div className="comments-section">
                    <h3 className="comments-header">Commenti ({comments.length})</h3>
                    <div className="comments-list">
                        {comments.map(comment => (
                            <div key={comment.id} className="comment-card">
                                <img src={comment.authorPic} alt={comment.author} className="comment-avatar" />
                                <div className="comment-content-wrapper">
                                    <div className="comment-header">
                                        <span className="comment-author">{comment.author}</span>
                                        {/* <span className="comment-time">Just now</span> */}
                                    </div>
                                    <p className="comment-text">{comment.text}</p>
                                    {comment.imageUrl && (
                                        <img src={comment.imageUrl} alt="Comment attachment" className="comment-image" />
                                    )}
                                    <div className="comment-footer">
                                        <button
                                            className={`coffee-vote-btn ${comment.coffeeBy?.includes(currentUser?.uid) ? 'active' : ''}`}
                                            onClick={() => handleCoffeeVote(comment.id, comment.coffees, comment.coffeeBy)}
                                        >
                                            ☕ {comment.coffees || 0}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PostDetails;
