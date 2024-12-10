const {Router} = require('express')
const {createPost, getPosts, getPost, getCatPosts,getUserPosts, deletePost,editPost} = require('../controllers/postControllers')
const router = Router()
const authMiddleware = require('../middleware/authMiddleware')

router.post('/',authMiddleware, createPost )
router.get('/', getPosts )
router.get('/:id', getPost )
router.get('/categories/:category', getCatPosts )
router.patch('/:id',authMiddleware, editPost)
router.get('/users/:id', getUserPosts)
router.delete('/:id',authMiddleware, deletePost)



module.exports = router