import React, { useState } from 'react';
import { BookOpen, Cpu, ShieldAlert, Sparkles, Zap, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';

export const EducationModule: React.FC = () => {
  const [expandedTopic, setExpandedTopic] = useState<string | null>('shor');

  const topics = [
    {
      id: 'shor',
      title: "Shor's Algorithm & Public Key Collapse",
      subtitle: "Why RSA, ECC, and ECDSA are broken by quantum computers",
      icon: ShieldAlert,
      color: 'text-rose-400 border-rose-500/30 bg-rose-950/20',
      content: (
        <div className="space-y-4 text-xs leading-relaxed text-slate-300">
          <p>
            In 1994, Peter Shor published a quantum algorithm that solves <strong>integer factorization</strong> and <strong>elliptic curve discrete logarithms</strong> in polynomial time O(n³).
          </p>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px]">
            <div className="text-cyan-300 font-bold mb-1">Classical Complexity vs Shor's Quantum Complexity:</div>
            <div>Classical RSA Factoring (GNFS): O(exp(c &middot; n^(1/3) &middot; log^(2/3) n)) &rarr; Billions of years for RSA-2048</div>
            <div>Shor's Quantum Factoring: O(n³) &rarr; Hours/Minutes on a ~4,000 physical qubit quantum computer</div>
          </div>
          <p>
            <strong>Affected Primitives:</strong> RSA (all key lengths), ECC (P-256, P-384, secp256k1), ECDSA, ECDH, Diffie-Hellman, DSA, Ed25519.
          </p>
        </div>
      )
    },
    {
      id: 'grover',
      title: "Grover's Algorithm & Symmetric Degradation",
      subtitle: "The quadratic search speedup on AES and SHA",
      icon: Zap,
      color: 'text-amber-400 border-amber-500/30 bg-amber-950/20',
      content: (
        <div className="space-y-4 text-xs leading-relaxed text-slate-300">
          <p>
            Published by Lov Grover in 1996, Grover's algorithm provides a <strong>quadratic speedup</strong> O(&radic;N) for searching an unsorted database of N items.
          </p>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px]">
            <div className="text-amber-300 font-bold mb-1">Effective Key Size Under Grover Search:</div>
            <div>AES-128 (128 bits) &rarr; 64 bits effective quantum security (DEGRADED)</div>
            <div>AES-256 (256 bits) &rarr; 128 bits effective quantum security (QUANTUM SAFE)</div>
            <div>SHA-256 Hash Collisions &rarr; 128 bits effective quantum collision resistance (SAFE)</div>
          </div>
          <p>
            <strong>Key Takeaway:</strong> Grover does NOT instantly break symmetric ciphers. Upgrading symmetric keys from 128 bits to 256 bits completely mitigates Grover's threat.
          </p>
        </div>
      )
    },
    {
      id: 'pqc_standards',
      title: "NIST Post-Quantum Standards (FIPS 203 / 204 / 205)",
      subtitle: "Official standards released by NIST in August 2024",
      icon: Sparkles,
      color: 'text-cyan-400 border-cyan-500/30 bg-cyan-950/20',
      content: (
        <div className="space-y-4 text-xs leading-relaxed text-slate-300">
          <p>
            In August 2024, the U.S. National Institute of Standards and Technology (NIST) finalized its official Post-Quantum Cryptography standards:
          </p>
          <div className="space-y-2 font-mono text-[11px]">
            <div className="p-3 rounded-xl bg-slate-950 border border-cyan-500/30">
              <div className="text-cyan-300 font-bold">&bull; FIPS 203: ML-KEM (Module-Lattice-Based Key Encapsulation)</div>
              <div className="text-slate-400 mt-0.5">Primary standard for general encryption and key agreement (formerly CRYSTALS-Kyber).</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-purple-500/30">
              <div className="text-purple-300 font-bold">&bull; FIPS 204: ML-DSA (Module-Lattice-Based Digital Signatures)</div>
              <div className="text-slate-400 mt-0.5">Primary standard for general digital signatures (formerly CRYSTALS-Dilithium).</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-teal-500/30">
              <div className="text-teal-300 font-bold">&bull; FIPS 205: SLH-DSA (Stateless Hash-Based Digital Signatures)</div>
              <div className="text-slate-400 mt-0.5">Backup signature standard based on hash trees (formerly SPHINCS+).</div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'qubits',
      title: "Quantum Physics Fundamentals (Qubits & Superposition)",
      subtitle: "How quantum mechanics enables exponential computational parallel processing",
      icon: Cpu,
      color: 'text-purple-400 border-purple-500/30 bg-purple-950/20',
      content: (
        <div className="space-y-4 text-xs leading-relaxed text-slate-300">
          <p>
            Classical bits represent either a binary <code>0</code> or <code>1</code>. <strong>Qubits</strong> exploit two core principles of quantum physics:
          </p>
          <ul className="list-disc pl-5 space-y-1 font-mono text-[11px] text-slate-300">
            <li><strong>Superposition:</strong> A qubit exists in a linear combination state $\alpha|0\rangle + \beta|1\rangle$ simultaneously until measured.</li>
            <li><strong>Entanglement:</strong> Two or more qubits become instantaneously correlated regardless of spatial distance.</li>
          </ul>
          <p>
            This allows a system of n entangled qubits to evaluate 2ⁿ computational paths concurrently.
          </p>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-8 w-full max-w-[1800px] mx-auto py-6 px-4 sm:px-8 lg:px-12 xl:px-16">
      
      {/* Title */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-mono bg-purple-950/60 text-purple-300 border border-purple-500/40">
          <BookOpen className="w-3.5 h-3.5" />
          <span>QUANTUM CYBERSECURITY LEARNING CENTER</span>
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight font-mono">
          UNDERSTANDING QUANTUM RISKS & PQC
        </h2>
        <p className="text-xs text-slate-400 max-w-xl mx-auto">
          Learn how quantum physics threatens classical public-key cryptography and how NIST Post-Quantum standards preserve global digital security.
        </p>
      </div>

      {/* Accordion List */}
      <div className="space-y-4">
        {topics.map((topic) => {
          const Icon = topic.icon;
          const isExpanded = expandedTopic === topic.id;

          return (
            <div
              key={topic.id}
              className={`glass-panel rounded-2xl border overflow-hidden transition-all duration-300 ${topic.color}`}
            >
              <div
                onClick={() => setExpandedTopic(isExpanded ? null : topic.id)}
                className="p-6 cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center space-x-4">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white font-mono">{topic.title}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{topic.subtitle}</p>
                  </div>
                </div>

                <div className="p-1 rounded-lg text-slate-400 hover:text-white">
                  {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </div>

              {isExpanded && (
                <div className="px-6 pb-6 pt-2 border-t border-slate-800/60">
                  {topic.content}
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
};
