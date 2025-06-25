import { Router } from 'express';
import { CONFIG } from '../config/index';
import auth from '../authMiddleware/authMiddleware';
import Messages from '../controller/message_course';

const router = Router();

router.route('/send-message').post(auth([CONFIG.ROLES.USER, CONFIG.ROLES.TUTOR]), Messages.sendMessage);
router.route('/reply-to-message').post(auth([CONFIG.ROLES.USER, CONFIG.ROLES.TUTOR]), Messages.replyToMessage);
router.route('/get-replies/:message_id').get(auth([CONFIG.ROLES.USER, CONFIG.ROLES.TUTOR]), Messages.getReplies);
router.route('/get-messages').get(auth([CONFIG.ROLES.USER, CONFIG.ROLES.TUTOR]), Messages.getMessagesForUser);
router.route('/update-messages').patch(auth([CONFIG.ROLES.USER, CONFIG.ROLES.TUTOR]), Messages.updateMessage);
router
  .route('/get-replies-message/:message_id')
  .get(auth([CONFIG.ROLES.USER, CONFIG.ROLES.TUTOR]), Messages.getMessageWithReplies);
router
  .route('/delete-message/:message_id')
  .delete(auth([CONFIG.ROLES.USER, CONFIG.ROLES.TUTOR]), Messages.deleteMessage);

export default router;
