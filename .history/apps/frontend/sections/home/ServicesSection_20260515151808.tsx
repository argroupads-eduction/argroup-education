// 'use client';

// import { motion } from 'framer-motion';
// import { SERVICES } from '@/lib/constants';

// export const ServicesSection = () => {
//   const container = {
//     hidden: { opacity: 0 },
//     visible: {
//       opacity: 1,
//       transition: { staggerChildren: 0.1, delayChildren: 0.2 },
//     },
//   };

//   const item = {
//     hidden: { opacity: 0, y: 20 },
//     visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
//   };

//   return (
//     <section className="section bg-white">
//       <div className="max-w-7xl mx-auto px-4">
//         {/* Header */}
//         <motion.div
//           className="text-center mb-16"
//           initial={{ opacity: 0, y: 20 }}
//           whileInView={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.6 }}
//           viewport={{ once: true }}
//         >
//           <h2 className="text-4xl md:text-5xl font-bold text-navy-900 mb-6">
//             Our <span className="text-gold-500">Premium Services</span>
//           </h2>
//           <p className="text-xl text-gray-600 max-w-2xl mx-auto">
//             End-to-end solutions for your medical education journey
//           </p>
//         </motion.div>

//         {/* Services Grid */}
//         <motion.div
//           className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
//           variants={container}
//           initial="hidden"
//           whileInView="visible"
//           viewport={{ once: true }}
//         >
//           {SERVICES.map((service) => (
//             <motion.div
//               key={service.id}
//               variants={item}
//               className="group"
//             >
//               <motion.div
//                 className="rounded-lg p-8 bg-white border border-gray-200 shadow-elevation-1 h-full transition-all"
//                 whileHover={{ y: -8, boxShadow: 'var(--shadow-elevation-3)' }}
//               >
//                 {/* Icon */}
//                 <motion.div
//                   className="w-14 h-14 rounded-lg bg-gradient-to-br from-gold-500 to-gold-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform"
//                   whileHover={{ rotate: 360 }}
//                   transition={{ duration: 0.8 }}
//                 >
//                   <span className="text-2xl text-white">
//                     {service.icon === 'Globe' && '🌍'}
//                     {service.icon === 'MapPin' && '📍'}
//                     {service.icon === 'FileText' && '📄'}
//                     {service.icon === 'Passport' && '🛂'}
//                     {service.icon === 'Users' && '👥'}
//                     {service.icon === 'Award' && '🏆'}
//                     {service.icon === 'CheckCircle' && '✓'}
//                     {service.icon === 'Plane' && '✈️'}
//                   </span>
//                 </motion.div>

//                 {/* Content */}
//                 <h3 className="text-xl font-bold text-navy-900 mb-3">
//                   {service.title}
//                 </h3>
//                 <p className="text-gray-600 leading-relaxed">
//                   {service.description}
//                 </p>

//                 {/* Arrow */}
//                 <motion.div
//                   className="mt-6 text-gold-500 font-semibold flex items-center gap-2"
//                   initial={{ x: 0 }}
//                   whileHover={{ x: 4 }}
//                 >
//                   Learn More →
//                 </motion.div>
//               </motion.div>
//             </motion.div>
//           ))}
//         </motion.div>
//       </div>
//     </section>
//   );
// };
